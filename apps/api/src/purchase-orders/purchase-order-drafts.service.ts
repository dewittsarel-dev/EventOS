import {
  Inject,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AiDraftCapability,
  AiDraftFieldDecision,
  AiDraftStatus,
  Prisma,
} from '@prisma/client';
import { AiDraftsService } from '../ai-drafts/ai-drafts.service';
import type { AiDraftFieldInput } from '../ai-drafts/ai-drafts.types';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import type {
  CreatePurchaseOrderDraftDto,
  PurchaseOrderDraftFieldReviewDto,
  PurchaseOrderDraftHeaderDto,
  PurchaseOrderDraftLineItemDto,
  UpdatePurchaseOrderDraftReviewDto,
} from './dto/purchase-order-draft.dto';
import {
  PURCHASE_ORDER_QUOTATION_EXTRACTOR,
  type PurchaseOrderQuotationExtractor,
} from './purchase-order-draft-extractor.service';

type PermissionAction = 'View' | 'Create' | 'Edit';
type RolePermissionMap = Record<string, Record<string, boolean>>;

type UploadedSourceFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type PurchaseOrderDraftPayload = {
  header: {
    purchaseOrderNumber: string | null;
    orderDate: string | null;
    quotationDate: string | null;
    validUntilDate: string | null;
    expectedDeliveryDate: string | null;
    supplierId: string | null;
    supplierName: string | null;
    supplierReference: string | null;
    internalReference: string | null;
    deliveryLocationId: string | null;
    currency: string;
    deliveryFee: number;
    deliveryAddress: string | null;
    paymentTerms: string | null;
    eventReference: string | null;
    notes: string | null;
    extractedTotal: number | null;
  };
  lineItems: Array<{
    id: string;
    description: string;
    unit: string | null;
    supplierProductId: string | null;
    inventoryItemId: string | null;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    vatPercent: number;
    notes: string | null;
    lineSubtotal: number;
    lineDiscount: number;
    lineTax: number;
    lineTotal: number;
    matched: boolean;
  }>;
  summary: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    deliveryFee: number;
    totalAmount: number;
  };
  issues: {
    missingRequiredFields: string[];
    lowConfidenceFields: string[];
    conflictingFields: string[];
  };
};

@Injectable()
export class PurchaseOrderDraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiDraftsService: AiDraftsService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    @Inject(PURCHASE_ORDER_QUOTATION_EXTRACTOR)
    private readonly extractor: PurchaseOrderQuotationExtractor,
  ) {}

  async createFromSource(
    userId: string,
    dto: CreatePurchaseOrderDraftDto,
    file?: UploadedSourceFile,
  ) {
    await this.ensureOrganizationPermission(
      userId,
      dto.organizationId,
      'Create',
    );

    if ((!dto.sourceText || dto.sourceText.trim().length === 0) && !file) {
      throw new BadRequestException('Provide quotation text or a source file');
    }

    const extraction = this.extractor.extract({
      sourceText: dto.sourceText,
      file,
    });

    const supplierMatch = extraction.header.supplierName?.value
      ? await this.matchSupplier(
          dto.organizationId,
          String(extraction.header.supplierName.value),
        )
      : null;

    const matchedLines = supplierMatch
      ? await this.matchSupplierProducts(
          dto.organizationId,
          supplierMatch.id,
          extraction.lineItems,
        )
      : extraction.lineItems.map((line) => ({
          ...line,
          supplierProductId: null,
          inventoryItemId: null,
          matched: false,
        }));

    const draftPayload = this.buildDraftPayload(
      extraction,
      supplierMatch,
      matchedLines,
    );
    const warnings = this.buildWarnings(
      draftPayload,
      extraction.warnings,
      supplierMatch,
    );
    const fields = this.buildFields(draftPayload, extraction, supplierMatch);

    const draft = await this.aiDraftsService.create({
      capability: AiDraftCapability.PurchaseOrder,
      organizationId: dto.organizationId,
      extractionAdapter: extraction.extractionAdapter,
      draftPayload,
      warnings,
      createdByUserId: userId,
      sourceDocuments: [
        {
          inputType: extraction.inputType,
          fileName: extraction.sourceFileName,
          mimeType: extraction.sourceMimeType,
          sizeBytes: file?.size ?? null,
          contentText: extraction.sourceText,
          contentBase64: extraction.sourceBytesBase64,
        },
      ],
      extractedFields: fields,
    });

    return this.mapDraftResponse(draft);
  }

  async createAiUploadDraft(
    userId: string,
    organizationId: string,
    file?: UploadedSourceFile,
  ) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('organizationId is required');
    }

    await this.ensureOrganizationPermission(userId, organizationId, 'Create');

    if (!file) {
      throw new BadRequestException('Upload a PDF source file');
    }

    const fileNameLower = file.originalname.toLowerCase();
    const isPdfByMime = file.mimetype === 'application/pdf';
    const isPdfByName = fileNameLower.endsWith('.pdf');

    if (!isPdfByMime && !isPdfByName) {
      throw new BadRequestException('Only PDF files are supported');
    }

    const extraction = this.extractor.extract({ file });
    const supplierMatch = extraction.header.supplierName?.value
      ? await this.matchSupplier(
          organizationId,
          String(extraction.header.supplierName.value),
        )
      : null;

    const matchedLines = supplierMatch
      ? await this.matchSupplierProducts(
          organizationId,
          supplierMatch.id,
          extraction.lineItems,
        )
      : extraction.lineItems.map((line) => ({
          ...line,
          supplierProductId: null,
          inventoryItemId: null,
          matched: false,
        }));

    const draftPayload = this.buildDraftPayload(
      extraction,
      supplierMatch,
      matchedLines,
    );
    const warnings = this.buildWarnings(
      draftPayload,
      extraction.warnings,
      supplierMatch,
    );
    const fields = this.buildFields(draftPayload, extraction, supplierMatch);

    const created = await this.aiDraftsService.create({
      capability: AiDraftCapability.PurchaseOrder,
      organizationId,
      extractionAdapter: extraction.extractionAdapter,
      draftPayload,
      warnings,
      createdByUserId: userId,
      sourceDocuments: [
        {
          inputType: extraction.inputType,
          fileName: extraction.sourceFileName,
          mimeType: extraction.sourceMimeType,
          sizeBytes: file.size,
          contentText: extraction.sourceText,
          contentBase64: extraction.sourceBytesBase64,
        },
      ],
      extractedFields: fields,
    });

    const documentId = created.sourceDocuments[0]?.id;
    if (!documentId) {
      throw new NotFoundException('Draft document was not created');
    }

    return {
      draftId: created.id,
      documentId,
    };
  }

  async findAiUploadDraft(userId: string, draftId: string) {
    const draft = await this.aiDraftsService.findById(draftId);
    this.assertPurchaseOrderDraft(draft.capability);
    await this.ensureOrganizationPermission(
      userId,
      draft.organizationId,
      'View',
    );

    const source = draft.sourceDocuments[0];

    return {
      id: draft.id,
      status: draft.status,
      sourceDocument: source
        ? {
            id: source.id,
            fileName: source.fileName,
            mimeType: source.mimeType,
            sizeBytes: source.sizeBytes,
          }
        : null,
    };
  }

  async getAiUploadDraftDocument(
    userId: string,
    draftId: string,
    documentId: string,
  ) {
    const draft = await this.aiDraftsService.findById(draftId);
    this.assertPurchaseOrderDraft(draft.capability);
    await this.ensureOrganizationPermission(
      userId,
      draft.organizationId,
      'View',
    );

    const source = draft.sourceDocuments.find(
      (document) => document.id === documentId,
    );

    if (!source || !source.contentBase64) {
      throw new NotFoundException('Draft source document not found');
    }

    return {
      fileName: source.fileName ?? 'purchase-order-source.pdf',
      mimeType: source.mimeType ?? 'application/pdf',
      bytes: Buffer.from(source.contentBase64, 'base64'),
    };
  }

  async findOne(userId: string, id: string) {
    const draft = await this.aiDraftsService.findById(id);
    this.assertPurchaseOrderDraft(draft.capability);
    await this.ensureOrganizationPermission(
      userId,
      draft.organizationId,
      'View',
    );
    return this.mapDraftResponse(draft);
  }

  async updateReview(
    userId: string,
    id: string,
    dto: UpdatePurchaseOrderDraftReviewDto,
  ) {
    const draft = await this.aiDraftsService.findById(id);
    this.assertPurchaseOrderDraft(draft.capability);
    await this.ensureOrganizationPermission(
      userId,
      draft.organizationId,
      'Edit',
    );

    const payload = this.normalizeReviewedPayload(dto.header, dto.lineItems);
    const warnings = this.buildWarningsFromReviewedPayload(payload);
    const fields = this.applyFieldReviews(payload, dto.fields);

    const updated = await this.aiDraftsService.update(id, {
      status: AiDraftStatus.ReviewSaved,
      draftPayload: payload,
      warnings,
      approvedPayload: payload,
      extractedFields: fields,
    });

    return this.mapDraftResponse(updated);
  }

  async commit(userId: string, id: string) {
    const draft = await this.aiDraftsService.findById(id);
    this.assertPurchaseOrderDraft(draft.capability);
    await this.ensureOrganizationPermission(
      userId,
      draft.organizationId,
      'Create',
    );

    if (draft.status === AiDraftStatus.Committed && draft.committedTargetId) {
      return this.purchaseOrdersService.findOne(
        userId,
        draft.committedTargetId,
      );
    }

    if (draft.status === AiDraftStatus.Committed && !draft.committedTargetId) {
      throw new BadRequestException(
        'Draft is already committed but missing linked purchase order. Contact support before retrying commit.',
      );
    }

    const payload = draft.draftPayload as unknown as PurchaseOrderDraftPayload;
    this.validatePayloadForCommit(payload);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const latest = await tx.aiDraft.findUnique({
            where: { id },
            select: {
              id: true,
              capability: true,
              status: true,
              organizationId: true,
              committedTargetId: true,
              draftPayload: true,
            },
          });

          if (!latest) {
            throw new BadRequestException(`Draft with id ${id} not found`);
          }

          this.assertPurchaseOrderDraft(latest.capability);

          if (
            latest.status === AiDraftStatus.Committed &&
            latest.committedTargetId
          ) {
            return this.purchaseOrdersService.findOne(
              userId,
              latest.committedTargetId,
            );
          }

          if (
            latest.status === AiDraftStatus.Committed &&
            !latest.committedTargetId
          ) {
            throw new BadRequestException(
              'Draft is already committed but missing linked purchase order. Contact support before retrying commit.',
            );
          }

          const latestPayload =
            latest.draftPayload as unknown as PurchaseOrderDraftPayload;
          this.validatePayloadForCommit(latestPayload);

          const purchaseOrder =
            await this.purchaseOrdersService.createInTransaction(
              tx,
              userId,
              this.buildPurchaseOrderCreateInput(
                latest.organizationId,
                latestPayload,
              ),
            );

          await tx.aiDraft.update({
            where: { id },
            data: {
              status: AiDraftStatus.Committed,
              approvedPayload: latestPayload,
              committedTargetId: purchaseOrder.id,
              committedAt: new Date(),
            },
          });

          return purchaseOrder;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new BadRequestException(
          'Draft commit encountered a concurrent update. Reload and retry once.',
        );
      }
      throw error;
    }
  }

  private buildPurchaseOrderCreateInput(
    organizationId: string,
    payload: PurchaseOrderDraftPayload,
  ) {
    return {
      organizationId,
      purchaseOrderNumber: payload.header.purchaseOrderNumber ?? '',
      supplierId: payload.header.supplierId ?? '',
      orderDate: payload.header.orderDate ?? '',
      quotationDate: payload.header.quotationDate ?? undefined,
      validUntilDate: payload.header.validUntilDate ?? undefined,
      expectedDeliveryDate: payload.header.expectedDeliveryDate ?? undefined,
      deliveryLocationId: payload.header.deliveryLocationId ?? '',
      currency: payload.header.currency,
      supplierReference: payload.header.supplierReference ?? undefined,
      internalReference: payload.header.internalReference ?? undefined,
      paymentTerms: payload.header.paymentTerms ?? undefined,
      deliveryAddress: payload.header.deliveryAddress ?? undefined,
      eventReference: payload.header.eventReference ?? undefined,
      deliveryFee: payload.header.deliveryFee,
      notes: payload.header.notes ?? undefined,
      lineItems: payload.lineItems.map((line) => ({
        supplierProductId: line.supplierProductId ?? '',
        quantity: line.quantity,
        unitCost: line.unitPrice,
        vatPercent: line.vatPercent,
        discountPercent: line.discountPercent,
        notes: line.notes ?? undefined,
      })),
    };
  }

  private buildDraftPayload(
    extraction: ReturnType<PurchaseOrderQuotationExtractor['extract']>,
    supplierMatch: { id: string; companyName: string } | null,
    matchedLines: Array<{
      description: string;
      quantity: number;
      unit: string | null;
      unitPrice: number;
      lineTotal: number;
      discountPercent: number;
      vatPercent: number;
      sourceReference: string;
      supplierProductId: string | null;
      inventoryItemId: string | null;
      matched: boolean;
    }>,
  ): PurchaseOrderDraftPayload {
    const lineItems = matchedLines.map((line) =>
      this.createDraftLine({
        id: crypto.randomUUID(),
        description: line.description,
        unit: line.unit,
        supplierProductId: line.supplierProductId,
        inventoryItemId: line.inventoryItemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent,
        vatPercent: line.vatPercent,
        notes: null,
        matched: line.matched,
      }),
    );

    const deliveryFee =
      typeof extraction.header.deliveryFee?.value === 'number'
        ? extraction.header.deliveryFee.value
        : 0;
    const summary = this.calculateDraftSummary(lineItems, deliveryFee);

    const payload: PurchaseOrderDraftPayload = {
      header: {
        purchaseOrderNumber: null,
        orderDate:
          typeof extraction.header.quotationDate?.value === 'string'
            ? extraction.header.quotationDate.value
            : null,
        quotationDate:
          typeof extraction.header.quotationDate?.value === 'string'
            ? extraction.header.quotationDate.value
            : null,
        validUntilDate:
          typeof extraction.header.validUntilDate?.value === 'string'
            ? extraction.header.validUntilDate.value
            : null,
        expectedDeliveryDate:
          typeof extraction.header.deliveryDate?.value === 'string'
            ? extraction.header.deliveryDate.value
            : null,
        supplierId: supplierMatch?.id ?? null,
        supplierName:
          supplierMatch?.companyName ??
          (typeof extraction.header.supplierName?.value === 'string'
            ? extraction.header.supplierName.value
            : null),
        supplierReference:
          typeof extraction.header.supplierReference?.value === 'string'
            ? extraction.header.supplierReference.value
            : null,
        internalReference: null,
        deliveryLocationId: null,
        currency:
          typeof extraction.header.currency?.value === 'string'
            ? extraction.header.currency.value
            : 'ZAR',
        deliveryFee,
        deliveryAddress:
          typeof extraction.header.deliveryText?.value === 'string'
            ? extraction.header.deliveryText.value
            : typeof extraction.header.deliveryAddress?.value === 'string'
              ? extraction.header.deliveryAddress.value
              : null,
        paymentTerms:
          typeof extraction.header.paymentTerms?.value === 'string'
            ? extraction.header.paymentTerms.value
            : null,
        eventReference:
          typeof extraction.header.eventReference?.value === 'string'
            ? extraction.header.eventReference.value
            : null,
        notes:
          typeof extraction.header.notes?.value === 'string'
            ? extraction.header.notes.value
            : null,
        extractedTotal:
          typeof extraction.header.total?.value === 'number'
            ? extraction.header.total.value
            : null,
      },
      lineItems,
      summary,
      issues: {
        missingRequiredFields: [],
        lowConfidenceFields: [],
        conflictingFields: [],
      },
    };

    payload.issues.missingRequiredFields =
      this.findMissingRequiredFields(payload);
    payload.issues.conflictingFields = this.findConflicts(payload);

    return payload;
  }

  private normalizeReviewedPayload(
    header: PurchaseOrderDraftHeaderDto,
    lineItems: PurchaseOrderDraftLineItemDto[],
  ): PurchaseOrderDraftPayload {
    const normalizedLines = lineItems.map((line) =>
      this.createDraftLine({
        id: line.id,
        description: line.description.trim(),
        unit: this.normalizeNullable(line.unit),
        supplierProductId: this.normalizeNullable(line.supplierProductId),
        inventoryItemId: this.normalizeNullable(line.inventoryItemId),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent ?? 0,
        vatPercent: line.vatPercent ?? 0,
        notes: this.normalizeNullable(line.notes),
        matched: Boolean(line.supplierProductId),
      }),
    );

    const deliveryFee = header.deliveryFee ?? 0;
    const payload: PurchaseOrderDraftPayload = {
      header: {
        purchaseOrderNumber: this.normalizeNullable(header.purchaseOrderNumber),
        orderDate: this.normalizeNullable(header.orderDate),
        quotationDate: this.normalizeNullable(header.quotationDate),
        validUntilDate: this.normalizeNullable(header.validUntilDate),
        expectedDeliveryDate: this.normalizeNullable(
          header.expectedDeliveryDate,
        ),
        supplierId: this.normalizeNullable(header.supplierId),
        supplierName: this.normalizeNullable(header.supplierName),
        supplierReference: this.normalizeNullable(header.supplierReference),
        internalReference: this.normalizeNullable(header.internalReference),
        deliveryLocationId: this.normalizeNullable(header.deliveryLocationId),
        currency: (header.currency?.trim() || 'ZAR').toUpperCase(),
        deliveryFee,
        deliveryAddress: this.normalizeNullable(header.deliveryAddress),
        paymentTerms: this.normalizeNullable(header.paymentTerms),
        eventReference: this.normalizeNullable(header.eventReference),
        notes: this.normalizeNullable(header.notes),
        extractedTotal: header.extractedTotal ?? null,
      },
      lineItems: normalizedLines,
      summary: this.calculateDraftSummary(normalizedLines, deliveryFee),
      issues: {
        missingRequiredFields: [],
        lowConfidenceFields: [],
        conflictingFields: [],
      },
    };

    payload.issues.missingRequiredFields =
      this.findMissingRequiredFields(payload);
    payload.issues.conflictingFields = this.findConflicts(payload);
    return payload;
  }

  private buildWarnings(
    payload: PurchaseOrderDraftPayload,
    extractionWarnings: Array<{
      code: string;
      message: string;
      fieldPath?: string;
    }>,
    supplierMatch: { id: string; companyName: string } | null,
  ) {
    const warnings = [...extractionWarnings];

    if (!supplierMatch && payload.header.supplierName) {
      warnings.push({
        code: 'unmatched_supplier',
        message:
          'Suggested supplier did not match an existing active supplier.',
        fieldPath: 'header.supplierId',
      });
    }

    payload.lineItems.forEach((line, index) => {
      if (!line.supplierProductId) {
        warnings.push({
          code: 'unmatched_inventory_item',
          message: `Line item ${index + 1} is not matched to a supplier product.`,
          fieldPath: `lineItems[${index}].supplierProductId`,
        });
      }
    });

    payload.issues.missingRequiredFields.forEach((fieldPath) => {
      warnings.push({
        code: 'missing_required_field',
        message: `Required field ${fieldPath} is missing.`,
        fieldPath,
      });
    });

    payload.issues.conflictingFields.forEach((fieldPath) => {
      warnings.push({
        code: 'conflicting_total',
        message:
          'Extracted quotation total conflicts with calculated purchase-order total.',
        fieldPath,
      });
    });

    return warnings;
  }

  private buildWarningsFromReviewedPayload(payload: PurchaseOrderDraftPayload) {
    const warnings: Array<{
      code: string;
      message: string;
      fieldPath?: string;
    }> = [];

    payload.issues.missingRequiredFields.forEach((fieldPath) => {
      warnings.push({
        code: 'missing_required_field',
        message: `Required field ${fieldPath} is missing.`,
        fieldPath,
      });
    });

    payload.issues.conflictingFields.forEach((fieldPath) => {
      warnings.push({
        code: 'conflicting_total',
        message:
          'Extracted quotation total conflicts with calculated purchase-order total.',
        fieldPath,
      });
    });

    payload.lineItems.forEach((line, index) => {
      if (!line.supplierProductId) {
        warnings.push({
          code: 'unmatched_inventory_item',
          message: `Line item ${index + 1} is not matched to a supplier product.`,
          fieldPath: `lineItems[${index}].supplierProductId`,
        });
      }
    });

    return warnings;
  }

  private buildFields(
    payload: PurchaseOrderDraftPayload,
    extraction: ReturnType<PurchaseOrderQuotationExtractor['extract']>,
    supplierMatch: { id: string; companyName: string } | null,
  ) {
    const fields: AiDraftFieldInput[] = [];
    const addField = (
      fieldPath: string,
      label: string,
      suggestedValue: unknown,
      finalValue: unknown,
      confidenceScore?: number,
      sourceReference?: string,
      isRequired = false,
    ) => {
      fields.push({
        fieldPath,
        label,
        suggestedValue,
        finalValue,
        confidenceScore: confidenceScore ?? null,
        sourceReference: sourceReference ?? null,
        decision:
          suggestedValue === undefined || suggestedValue === null
            ? AiDraftFieldDecision.Manual
            : AiDraftFieldDecision.Suggested,
        isRequired,
        lowConfidence: confidenceScore !== undefined && confidenceScore < 0.6,
      });
    };

    addField(
      'header.purchaseOrderNumber',
      'Purchase Order Number',
      null,
      payload.header.purchaseOrderNumber,
      undefined,
      undefined,
      true,
    );
    addField(
      'header.orderDate',
      'Order Date',
      extraction.header.quotationDate?.value,
      payload.header.orderDate,
      extraction.header.quotationDate?.confidence,
      extraction.header.quotationDate?.sourceReference,
      true,
    );
    addField(
      'header.quotationDate',
      'Quotation Date',
      extraction.header.quotationDate?.value,
      payload.header.quotationDate,
      extraction.header.quotationDate?.confidence,
      extraction.header.quotationDate?.sourceReference,
    );
    addField(
      'header.expectedDeliveryDate',
      'Expected Delivery Date',
      extraction.header.deliveryDate?.value,
      payload.header.expectedDeliveryDate,
      extraction.header.deliveryDate?.confidence,
      extraction.header.deliveryDate?.sourceReference,
    );
    addField(
      'header.currency',
      'Currency',
      extraction.header.currency?.value,
      payload.header.currency,
      extraction.header.currency?.confidence,
      extraction.header.currency?.sourceReference,
    );
    addField(
      'header.validUntilDate',
      'Valid Until Date',
      extraction.header.validUntilDate?.value,
      payload.header.validUntilDate,
      extraction.header.validUntilDate?.confidence,
      extraction.header.validUntilDate?.sourceReference,
    );
    addField(
      'header.supplierId',
      'Supplier',
      supplierMatch?.id ?? extraction.header.supplierName?.value ?? null,
      payload.header.supplierId,
      extraction.header.supplierName?.confidence,
      extraction.header.supplierName?.sourceReference,
      true,
    );
    addField(
      'header.supplierReference',
      'Supplier Reference',
      extraction.header.supplierReference?.value,
      payload.header.supplierReference,
      extraction.header.supplierReference?.confidence,
      extraction.header.supplierReference?.sourceReference,
    );
    addField(
      'header.deliveryLocationId',
      'Delivery Location',
      null,
      payload.header.deliveryLocationId,
      undefined,
      undefined,
      true,
    );
    addField(
      'header.deliveryAddress',
      'Delivery Address',
      extraction.header.deliveryText?.value ??
        extraction.header.deliveryAddress?.value,
      payload.header.deliveryAddress,
      extraction.header.deliveryText?.confidence ??
        extraction.header.deliveryAddress?.confidence,
      extraction.header.deliveryText?.sourceReference ??
        extraction.header.deliveryAddress?.sourceReference,
    );
    addField(
      'header.paymentTerms',
      'Payment Terms',
      extraction.header.paymentTerms?.value,
      payload.header.paymentTerms,
      extraction.header.paymentTerms?.confidence,
      extraction.header.paymentTerms?.sourceReference,
    );
    addField(
      'header.eventReference',
      'Event Reference',
      extraction.header.eventReference?.value,
      payload.header.eventReference,
      extraction.header.eventReference?.confidence,
      extraction.header.eventReference?.sourceReference,
    );
    addField(
      'header.deliveryFee',
      'Delivery Fee',
      extraction.header.deliveryFee?.value,
      payload.header.deliveryFee,
      extraction.header.deliveryFee?.confidence,
      extraction.header.deliveryFee?.sourceReference,
    );
    addField(
      'header.summarySubtotal',
      'Extracted Subtotal',
      extraction.header.subtotal?.value,
      payload.summary.subtotal,
      extraction.header.subtotal?.confidence,
      extraction.header.subtotal?.sourceReference,
    );
    addField(
      'header.summaryVatAmount',
      'Extracted VAT Amount',
      extraction.header.vatAmount?.value,
      payload.summary.taxAmount,
      extraction.header.vatAmount?.confidence,
      extraction.header.vatAmount?.sourceReference,
    );
    addField(
      'header.extractedTotal',
      'Quoted Total',
      extraction.header.total?.value,
      payload.header.extractedTotal,
      extraction.header.total?.confidence,
      extraction.header.total?.sourceReference,
    );
    addField(
      'header.notes',
      'Notes',
      extraction.header.notes?.value,
      payload.header.notes,
      extraction.header.notes?.confidence,
      extraction.header.notes?.sourceReference,
    );

    payload.lineItems.forEach((line, index) => {
      const extractedLine = extraction.lineItems[index];
      addField(
        `lineItems[${index}].description`,
        `Line ${index + 1} Description`,
        extractedLine?.description ?? null,
        line.description,
        extractedLine ? 0.85 : undefined,
        extractedLine?.sourceReference,
        true,
      );
      addField(
        `lineItems[${index}].supplierProductId`,
        `Line ${index + 1} Product Match`,
        line.supplierProductId,
        line.supplierProductId,
        line.matched ? 0.8 : 0.3,
        extractedLine?.sourceReference,
        true,
      );
      addField(
        `lineItems[${index}].unit`,
        `Line ${index + 1} Unit`,
        extractedLine?.unit ?? null,
        line.unit,
        extractedLine ? 0.7 : undefined,
        extractedLine?.sourceReference,
      );
      addField(
        `lineItems[${index}].quantity`,
        `Line ${index + 1} Quantity`,
        extractedLine?.quantity ?? null,
        line.quantity,
        extractedLine ? 0.85 : undefined,
        extractedLine?.sourceReference,
        true,
      );
      addField(
        `lineItems[${index}].unitPrice`,
        `Line ${index + 1} Unit Price`,
        extractedLine?.unitPrice ?? null,
        line.unitPrice,
        extractedLine ? 0.85 : undefined,
        extractedLine?.sourceReference,
        true,
      );
      addField(
        `lineItems[${index}].lineTotal`,
        `Line ${index + 1} Line Total`,
        extractedLine?.lineTotal ?? null,
        line.lineTotal,
        extractedLine ? 0.72 : undefined,
        extractedLine?.sourceReference,
      );
      addField(
        `lineItems[${index}].discountPercent`,
        `Line ${index + 1} Discount Percent`,
        extractedLine?.discountPercent ?? null,
        line.discountPercent,
        extractedLine ? 0.75 : undefined,
        extractedLine?.sourceReference,
      );
      addField(
        `lineItems[${index}].vatPercent`,
        `Line ${index + 1} VAT Percent`,
        extractedLine?.vatPercent ?? null,
        line.vatPercent,
        extractedLine ? 0.75 : undefined,
        extractedLine?.sourceReference,
      );
    });

    return fields;
  }

  private applyFieldReviews(
    payload: PurchaseOrderDraftPayload,
    reviews: PurchaseOrderDraftFieldReviewDto[],
  ) {
    const reviewMap = new Map(
      reviews.map((review) => [review.fieldPath, review]),
    );
    const extractionWarnings = this.buildFields(
      payload,
      this.emptyExtraction(),
      null,
    );

    return extractionWarnings.map((field) => {
      const review = reviewMap.get(field.fieldPath);
      if (!review) {
        return field;
      }

      return {
        ...field,
        finalValue: review.finalValue,
        decision: review.decision,
      };
    });
  }

  private emptyExtraction(): ReturnType<
    PurchaseOrderQuotationExtractor['extract']
  > {
    return {
      inputType: 'Text',
      extractionAdapter: 'deterministic-rule-parser-v1',
      sourceText: null,
      sourceFileName: null,
      sourceMimeType: null,
      sourceBytesBase64: null,
      header: {},
      lineItems: [],
      warnings: [],
    };
  }

  private findMissingRequiredFields(payload: PurchaseOrderDraftPayload) {
    const missing: string[] = [];
    if (!payload.header.purchaseOrderNumber) {
      missing.push('header.purchaseOrderNumber');
    }
    if (!payload.header.orderDate) {
      missing.push('header.orderDate');
    }
    if (!payload.header.supplierId) {
      missing.push('header.supplierId');
    }
    if (!payload.header.deliveryLocationId) {
      missing.push('header.deliveryLocationId');
    }
    if (payload.lineItems.length === 0) {
      missing.push('lineItems');
    }
    payload.lineItems.forEach((line, index) => {
      if (!line.description) {
        missing.push(`lineItems[${index}].description`);
      }
      if (!line.supplierProductId) {
        missing.push(`lineItems[${index}].supplierProductId`);
      }
      if (line.quantity <= 0) {
        missing.push(`lineItems[${index}].quantity`);
      }
    });
    return missing;
  }

  private findConflicts(payload: PurchaseOrderDraftPayload) {
    const conflicts: string[] = [];
    if (
      payload.header.extractedTotal !== null &&
      Math.abs(payload.header.extractedTotal - payload.summary.totalAmount) >
        0.05
    ) {
      conflicts.push('header.extractedTotal');
    }
    return conflicts;
  }

  private validatePayloadForCommit(payload: PurchaseOrderDraftPayload) {
    if (payload.issues.missingRequiredFields.length > 0) {
      throw new BadRequestException(
        `Resolve required draft fields before saving: ${payload.issues.missingRequiredFields.join(', ')}`,
      );
    }
  }

  private mapDraftResponse(
    draft: Awaited<ReturnType<AiDraftsService['findById']>>,
  ) {
    const payload = draft.draftPayload as unknown as PurchaseOrderDraftPayload;
    const warnings = Array.isArray(draft.warnings)
      ? draft.warnings
      : ((draft.warnings as unknown as Array<{
          code: string;
          message: string;
          fieldPath?: string;
        }>) ?? []);

    return {
      id: draft.id,
      capability: draft.capability,
      status: draft.status,
      extractionAdapter: draft.extractionAdapter,
      committedTargetId: draft.committedTargetId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      sourceDocuments: draft.sourceDocuments.map((source) => ({
        id: source.id,
        inputType: source.inputType,
        fileName: source.fileName,
        mimeType: source.mimeType,
        sizeBytes: source.sizeBytes,
        hasStoredBinary: Boolean(source.contentBase64),
        hasStoredText: Boolean(source.contentText),
      })),
      payload,
      fields: draft.extractedFields.map((field) => ({
        id: field.id,
        fieldPath: field.fieldPath,
        label: field.label,
        suggestedValue: field.suggestedValue,
        finalValue: field.finalValue,
        confidenceScore: field.confidenceScore,
        sourceReference: field.sourceReference,
        decision: field.decision,
        isRequired: field.isRequired,
        lowConfidence: field.lowConfidence,
      })),
      warnings,
      missingRequiredFields: payload.issues.missingRequiredFields,
      lowConfidenceFields: draft.extractedFields
        .filter((field) => field.lowConfidence)
        .map((field) => field.fieldPath),
      conflictingFields: payload.issues.conflictingFields,
      manualWorkflowPath: '/purchase-orders/new',
    };
  }

  private async matchSupplier(organizationId: string, supplierName: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        organizationId,
        active: true,
      },
      select: {
        id: true,
        companyName: true,
      },
      orderBy: {
        companyName: 'asc',
      },
    });

    const normalizedTarget = this.normalizeSearchText(supplierName);
    return (
      suppliers.find(
        (supplier) =>
          this.normalizeSearchText(supplier.companyName) === normalizedTarget,
      ) ??
      suppliers.find((supplier) =>
        this.normalizeSearchText(supplier.companyName).includes(
          normalizedTarget,
        ),
      ) ??
      null
    );
  }

  private async matchSupplierProducts(
    organizationId: string,
    supplierId: string,
    lineItems: Array<{
      description: string;
      quantity: number;
      unit: string | null;
      unitPrice: number;
      lineTotal: number;
      discountPercent: number;
      vatPercent: number;
      sourceReference: string;
    }>,
  ) {
    const products = await this.prisma.supplierProduct.findMany({
      where: {
        organizationId,
        supplierId,
        active: true,
      },
      select: {
        id: true,
        productName: true,
        sku: true,
      },
    });

    return lineItems.map((line) => {
      const normalizedDescription = this.normalizeSearchText(line.description);
      const matched =
        products.find(
          (product) =>
            this.normalizeSearchText(product.productName) ===
            normalizedDescription,
        ) ??
        products.find(
          (product) =>
            this.normalizeSearchText(product.productName).includes(
              normalizedDescription,
            ) ||
            normalizedDescription.includes(
              this.normalizeSearchText(product.productName),
            ),
        ) ??
        null;

      return {
        ...line,
        unit: line.unit,
        supplierProductId: matched?.id ?? null,
        inventoryItemId: null,
        matched: Boolean(matched),
      };
    });
  }

  private assertPurchaseOrderDraft(capability: AiDraftCapability) {
    if (capability !== AiDraftCapability.PurchaseOrder) {
      throw new BadRequestException('Draft does not belong to Purchase Orders');
    }
  }

  private normalizeNullable(value: string | null | undefined) {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private normalizeSearchText(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private createDraftLine(line: {
    id: string;
    description: string;
    unit: string | null;
    supplierProductId: string | null;
    inventoryItemId: string | null;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    vatPercent: number;
    notes: string | null;
    matched: boolean;
  }) {
    const lineSubtotal = this.round2(line.quantity * line.unitPrice);
    const lineDiscount = this.round2(
      (lineSubtotal * (line.discountPercent ?? 0)) / 100,
    );
    const taxableBase = this.round2(lineSubtotal - lineDiscount);
    const lineTax = this.round2((taxableBase * (line.vatPercent ?? 0)) / 100);
    const lineTotal = this.round2(taxableBase + lineTax);

    return {
      ...line,
      discountPercent: line.discountPercent ?? 0,
      vatPercent: line.vatPercent ?? 0,
      lineSubtotal,
      lineDiscount,
      lineTax,
      lineTotal,
    };
  }

  private calculateDraftSummary(
    lineItems: PurchaseOrderDraftPayload['lineItems'],
    deliveryFee: number,
  ) {
    return {
      subtotal: this.round2(
        lineItems.reduce((sum, line) => sum + line.lineSubtotal, 0),
      ),
      taxAmount: this.round2(
        lineItems.reduce((sum, line) => sum + line.lineTax, 0),
      ),
      discountAmount: this.round2(
        lineItems.reduce((sum, line) => sum + line.lineDiscount, 0),
      ),
      deliveryFee,
      totalAmount: this.round2(
        lineItems.reduce((sum, line) => sum + line.lineTotal, 0) + deliveryFee,
      ),
    };
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }

  private async ensureOrganizationPermission(
    userId: string,
    organizationId: string,
    action: PermissionAction,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    const normalizedRole = membership.role.trim().toLowerCase();
    if (normalizedRole === 'owner' || normalizedRole === 'administrator') {
      return;
    }

    const role = await this.prisma.role.findFirst({
      where: {
        organizationId,
        name: membership.role,
      },
      select: {
        permissions: true,
      },
    });

    if (!role) {
      throw new ForbiddenException('No role permissions found for this user');
    }

    let permissions: RolePermissionMap = {};
    try {
      permissions = JSON.parse(role.permissions) as RolePermissionMap;
    } catch {
      permissions = {};
    }

    const allowed = Boolean(
      permissions['Purchase Orders']?.[action] ??
      permissions.Purchasing?.[action],
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Missing Purchase Orders ${action} permission`,
      );
    }
  }
}
