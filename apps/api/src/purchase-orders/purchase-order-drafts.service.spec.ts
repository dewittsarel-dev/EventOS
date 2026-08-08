import { BadRequestException } from '@nestjs/common';
import { AiDraftCapability, AiDraftStatus } from '@prisma/client';
import { PurchaseOrderDraftsService } from './purchase-order-drafts.service';

describe('PurchaseOrderDraftsService', () => {
  const organizationId = '11111111-1111-4111-8111-111111111111';
  const supplierId = '22222222-2222-4222-8222-222222222222';
  const locationId = '33333333-3333-4333-8333-333333333333';
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
    },
    supplierProduct: {
      findMany: jest.fn(),
    },
    aiDraft: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const aiDraftsService = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  const purchaseOrdersService = {
    create: jest.fn(),
    createInTransaction: jest.fn(),
    findOne: jest.fn(),
  };

  const extractor = {
    extract: jest.fn(),
  };

  let service: PurchaseOrderDraftsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PurchaseOrderDraftsService(
      prisma as never,
      aiDraftsService as never,
      purchaseOrdersService as never,
      extractor,
    );

    prisma.membership.findUnique.mockResolvedValue({
      id: 'membership-1',
      userId,
      organizationId,
      role: 'owner',
    });

    prisma.supplier.findMany.mockResolvedValue([
      {
        id: supplierId,
        companyName: 'Cape Event Supply',
      },
    ]);

    prisma.supplierProduct.findMany.mockResolvedValue([
      {
        id: 'product-1',
        productName: 'Chair Hire',
        sku: 'CHAIR-1',
      },
    ]);

    prisma.$transaction.mockImplementation(async (handler: unknown) => {
      if (typeof handler === 'function') {
        const transactionHandler = handler as (
          client: typeof prisma,
        ) => Promise<unknown>;
        return transactionHandler(prisma);
      }

      return Promise.all(handler as Promise<unknown>[]);
    });
  });

  it('creates a persisted review draft from extracted quotation data', async () => {
    extractor.extract.mockReturnValue({
      inputType: 'Text',
      extractionAdapter: 'deterministic-rule-parser-v1',
      sourceText: 'mock text',
      sourceFileName: null,
      sourceMimeType: null,
      sourceBytesBase64: null,
      header: {
        supplierName: {
          value: 'Cape Event Supply',
          confidence: 0.9,
          sourceReference: 'text:line 1',
        },
        supplierReference: {
          value: 'Q-1',
          confidence: 0.8,
          sourceReference: 'text:line 2',
        },
        quotationDate: {
          value: '2026-08-03T00:00:00.000Z',
          confidence: 0.8,
          sourceReference: 'text:line 3',
        },
      },
      lineItems: [
        {
          description: 'Chair Hire',
          quantity: 10,
          unitPrice: 25,
          discountPercent: 0,
          vatPercent: 15,
          sourceReference: 'text:line 4',
        },
      ],
      warnings: [],
    });

    aiDraftsService.create.mockResolvedValue({
      id: 'draft-1',
      capability: AiDraftCapability.PurchaseOrder,
      status: AiDraftStatus.ReviewPending,
      extractionAdapter: 'deterministic-rule-parser-v1',
      committedTargetId: null,
      createdAt: new Date('2026-08-03T10:00:00.000Z'),
      updatedAt: new Date('2026-08-03T10:00:00.000Z'),
      draftPayload: {
        header: {
          purchaseOrderNumber: null,
          orderDate: '2026-08-03T00:00:00.000Z',
          quotationDate: '2026-08-03T00:00:00.000Z',
          validUntilDate: null,
          expectedDeliveryDate: null,
          supplierId,
          supplierName: 'Cape Event Supply',
          supplierReference: 'Q-1',
          internalReference: null,
          deliveryLocationId: null,
          currency: 'ZAR',
          deliveryFee: 0,
          deliveryAddress: null,
          paymentTerms: null,
          eventReference: null,
          notes: null,
          extractedTotal: null,
        },
        lineItems: [],
        summary: {
          subtotal: 250,
          taxAmount: 37.5,
          discountAmount: 0,
          deliveryFee: 0,
          totalAmount: 287.5,
        },
        issues: {
          missingRequiredFields: ['header.purchaseOrderNumber'],
          lowConfidenceFields: [],
          conflictingFields: [],
        },
      },
      warnings: [],
      sourceDocuments: [],
      extractedFields: [],
    });

    const result = await service.createFromSource(userId, {
      organizationId,
      sourceText: 'mock text',
    });

    expect(aiDraftsService.create).toHaveBeenCalled();
    expect(result.id).toBe('draft-1');
    expect(result.missingRequiredFields).toContain(
      'header.purchaseOrderNumber',
    );
  });

  it('commits an approved draft through the existing purchase-order create boundary', async () => {
    aiDraftsService.findById.mockResolvedValue({
      id: 'draft-1',
      capability: AiDraftCapability.PurchaseOrder,
      organizationId,
      status: AiDraftStatus.ReviewSaved,
      draftPayload: {
        header: {
          purchaseOrderNumber: 'PO-1001',
          orderDate: '2026-08-03T00:00:00.000Z',
          quotationDate: '2026-08-03T00:00:00.000Z',
          validUntilDate: null,
          expectedDeliveryDate: null,
          supplierId,
          supplierName: 'Cape Event Supply',
          supplierReference: 'Q-1',
          internalReference: null,
          deliveryLocationId: locationId,
          currency: 'ZAR',
          deliveryFee: 0,
          deliveryAddress: null,
          paymentTerms: null,
          eventReference: null,
          notes: null,
          extractedTotal: null,
        },
        lineItems: [
          {
            id: 'line-1',
            description: 'Chair Hire',
            supplierProductId: 'product-1',
            inventoryItemId: null,
            quantity: 10,
            unitPrice: 25,
            discountPercent: 0,
            vatPercent: 15,
            notes: null,
            lineSubtotal: 250,
            lineDiscount: 0,
            lineTax: 37.5,
            lineTotal: 287.5,
            matched: true,
          },
        ],
        summary: {
          subtotal: 250,
          taxAmount: 37.5,
          discountAmount: 0,
          deliveryFee: 0,
          totalAmount: 287.5,
        },
        issues: {
          missingRequiredFields: [],
          lowConfidenceFields: [],
          conflictingFields: [],
        },
      },
    });

    purchaseOrdersService.createInTransaction.mockResolvedValue({
      id: 'po-1',
      purchaseOrderNumber: 'PO-1001',
    });

    prisma.aiDraft.findUnique.mockResolvedValue({
      id: 'draft-1',
      capability: AiDraftCapability.PurchaseOrder,
      organizationId,
      status: AiDraftStatus.ReviewSaved,
      committedTargetId: null,
      draftPayload: {
        header: {
          purchaseOrderNumber: 'PO-1001',
          orderDate: '2026-08-03T00:00:00.000Z',
          quotationDate: '2026-08-03T00:00:00.000Z',
          validUntilDate: null,
          expectedDeliveryDate: null,
          supplierId,
          supplierName: 'Cape Event Supply',
          supplierReference: 'Q-1',
          internalReference: null,
          deliveryLocationId: locationId,
          currency: 'ZAR',
          deliveryFee: 0,
          deliveryAddress: null,
          paymentTerms: null,
          eventReference: null,
          notes: null,
          extractedTotal: null,
        },
        lineItems: [
          {
            id: 'line-1',
            description: 'Chair Hire',
            supplierProductId: 'product-1',
            inventoryItemId: null,
            quantity: 10,
            unitPrice: 25,
            discountPercent: 0,
            vatPercent: 15,
            notes: null,
            lineSubtotal: 250,
            lineDiscount: 0,
            lineTax: 37.5,
            lineTotal: 287.5,
            matched: true,
          },
        ],
        summary: {
          subtotal: 250,
          taxAmount: 37.5,
          discountAmount: 0,
          deliveryFee: 0,
          totalAmount: 287.5,
        },
        issues: {
          missingRequiredFields: [],
          lowConfidenceFields: [],
          conflictingFields: [],
        },
      },
    });

    prisma.aiDraft.update.mockResolvedValue({ id: 'draft-1' });

    await service.commit(userId, 'draft-1');

    expect(purchaseOrdersService.createInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      expect.objectContaining({
        organizationId,
        purchaseOrderNumber: 'PO-1001',
        supplierId,
        deliveryLocationId: locationId,
      }),
    );
  });

  it('rejects commit when required fields are still missing', async () => {
    aiDraftsService.findById.mockResolvedValue({
      id: 'draft-1',
      capability: AiDraftCapability.PurchaseOrder,
      organizationId,
      status: AiDraftStatus.ReviewSaved,
      draftPayload: {
        header: {
          purchaseOrderNumber: null,
          orderDate: null,
          supplierId: null,
          deliveryLocationId: null,
        },
        lineItems: [],
        summary: {
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          deliveryFee: 0,
          totalAmount: 0,
        },
        issues: {
          missingRequiredFields: ['header.purchaseOrderNumber'],
          lowConfidenceFields: [],
          conflictingFields: [],
        },
      },
    });

    await expect(service.commit(userId, 'draft-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(purchaseOrdersService.createInTransaction).not.toHaveBeenCalled();
  });

  it('returns existing purchase order for an already committed draft', async () => {
    aiDraftsService.findById.mockResolvedValue({
      id: 'draft-1',
      capability: AiDraftCapability.PurchaseOrder,
      organizationId,
      status: AiDraftStatus.Committed,
      committedTargetId: 'po-existing',
      draftPayload: {
        header: {
          purchaseOrderNumber: 'PO-1001',
          orderDate: '2026-08-03T00:00:00.000Z',
          supplierId,
          deliveryLocationId: locationId,
          currency: 'ZAR',
          deliveryFee: 0,
        },
        lineItems: [],
        summary: {
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          deliveryFee: 0,
          totalAmount: 0,
        },
        issues: {
          missingRequiredFields: [],
          lowConfidenceFields: [],
          conflictingFields: [],
        },
      },
    });

    purchaseOrdersService.findOne.mockResolvedValue({ id: 'po-existing' });

    const result = await service.commit(userId, 'draft-1');

    expect(purchaseOrdersService.findOne).toHaveBeenCalledWith(
      userId,
      'po-existing',
    );
    expect(purchaseOrdersService.createInTransaction).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'po-existing' });
  });

  it('creates an AI upload draft from extracted PDF data and returns ids', async () => {
    extractor.extract.mockReturnValue({
      inputType: 'Pdf',
      extractionAdapter: 'deterministic-rule-parser-v1',
      sourceText: 'mock extracted text',
      sourceFileName: 'supplier-quote.pdf',
      sourceMimeType: 'application/pdf',
      sourceBytesBase64: 'JVBERi0xLjQ=',
      header: {
        supplierName: {
          value: 'Cape Event Supply',
          confidence: 0.9,
          sourceReference: 'text:line 1',
        },
        quotationDate: {
          value: '2026-08-03T00:00:00.000Z',
          confidence: 0.8,
          sourceReference: 'text:line 2',
        },
        currency: {
          value: 'ZAR',
          confidence: 0.8,
          sourceReference: 'text:line 3',
        },
        subtotal: {
          value: 1200,
          confidence: 0.8,
          sourceReference: 'text:line 4',
        },
        vatAmount: {
          value: 180,
          confidence: 0.7,
          sourceReference: 'text:line 5',
        },
        total: {
          value: 1380,
          confidence: 0.8,
          sourceReference: 'text:line 6',
        },
      },
      lineItems: [
        {
          description: 'Folding Chair',
          quantity: 20,
          unit: 'each',
          unitPrice: 35,
          lineTotal: 700,
          discountPercent: 0,
          vatPercent: 15,
          sourceReference: 'text:line 7',
        },
      ],
      warnings: [],
    });

    aiDraftsService.create.mockResolvedValue({
      id: 'draft-ai-1',
      capability: AiDraftCapability.PurchaseOrder,
      status: AiDraftStatus.ReviewPending,
      extractionAdapter: 'deterministic-rule-parser-v1',
      committedTargetId: null,
      createdAt: new Date('2026-08-03T10:00:00.000Z'),
      updatedAt: new Date('2026-08-03T10:00:00.000Z'),
      draftPayload: {
        header: {
          purchaseOrderNumber: null,
          orderDate: '2026-08-03T00:00:00.000Z',
          quotationDate: '2026-08-03T00:00:00.000Z',
          validUntilDate: null,
          expectedDeliveryDate: null,
          supplierId,
          supplierName: 'Cape Event Supply',
          supplierReference: null,
          internalReference: null,
          deliveryLocationId: null,
          currency: 'ZAR',
          deliveryFee: 0,
          deliveryAddress: null,
          paymentTerms: null,
          eventReference: null,
          notes: null,
          extractedTotal: 1380,
        },
        lineItems: [],
        summary: {
          subtotal: 700,
          taxAmount: 105,
          discountAmount: 0,
          deliveryFee: 0,
          totalAmount: 805,
        },
        issues: {
          missingRequiredFields: ['header.purchaseOrderNumber'],
          lowConfidenceFields: [],
          conflictingFields: [],
        },
      },
      warnings: [],
      sourceDocuments: [
        {
          id: 'doc-ai-1',
          inputType: 'Pdf',
          fileName: 'supplier-quote.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 200,
          contentText: 'mock extracted text',
          contentBase64: 'JVBERi0xLjQ=',
          createdAt: new Date('2026-08-03T10:00:00.000Z'),
        },
      ],
      extractedFields: [],
    });

    await expect(
      service.createAiUploadDraft(userId, organizationId, {
        originalname: 'supplier-quote.pdf',
        mimetype: 'application/pdf',
        size: 200,
        buffer: Buffer.from('%PDF-mock%'),
      }),
    ).resolves.toEqual({
      draftId: 'draft-ai-1',
      documentId: 'doc-ai-1',
    });

    expect(extractor.extract).toHaveBeenCalled();
    expect(aiDraftsService.create).toHaveBeenCalled();
  });
});
