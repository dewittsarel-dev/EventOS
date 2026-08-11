import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSupplierCatalogueImportDto,
  UpdateSupplierCatalogueImportDto,
} from './dto/supplier-catalogue-import.dto';

type Candidate = Record<string, unknown> & {
  productName?: string;
  sku?: string;
  issues?: unknown[];
  imageUrls?: unknown[];
  searchTerms?: unknown[];
};

export function scoreImportCandidate(candidate: Candidate) {
  const warnings: string[] = [];
  let score = 0;
  if (String(candidate.productName ?? '').trim()) score += 25;
  else warnings.push('Product name requires review.');
  if (candidate.category) score += 15;
  else warnings.push('Category requires review.');
  if (candidate.subcategory) score += 10;
  else warnings.push('Subcategory requires review.');
  if (candidate.description) score += 10;
  else warnings.push('Description requires review.');
  if (Number(candidate.costPrice) >= 0) score += 10;
  else warnings.push('Price requires confirmation.');
  if (Number(candidate.totalQuantity) >= 0) score += 10;
  else warnings.push('Quantity requires confirmation.');
  if (Array.isArray(candidate.imageUrls) && candidate.imageUrls.length)
    score += 10;
  else warnings.push('Add a product image before Marketplace publication.');
  if (Array.isArray(candidate.searchTerms) && candidate.searchTerms.length)
    score += 10;
  else warnings.push('Search terms require review.');
  return { score, warnings };
}

@Injectable()
export class SupplierCatalogueImportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    supplierId: string,
    dto: CreateSupplierCatalogueImportDto,
  ) {
    await this.ensureScope(userId, supplierId, dto.organizationId);
    const candidates = await this.enrich(
      dto.organizationId,
      supplierId,
      dto.candidates as Candidate[],
    );
    return this.prisma.supplierCatalogueImport.create({
      data: {
        organizationId: dto.organizationId,
        supplierId,
        createdById: userId,
        sourceFiles: dto.sourceFiles as Prisma.InputJsonValue,
        candidates: candidates as Prisma.InputJsonValue,
        extractionAdapter: dto.extractionAdapter,
      },
    });
  }

  async list(userId: string, supplierId: string, organizationId: string) {
    await this.ensureScope(userId, supplierId, organizationId);
    return this.prisma.supplierCatalogueImport.findMany({
      where: { organizationId, supplierId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(
    userId: string,
    supplierId: string,
    importId: string,
    dto: UpdateSupplierCatalogueImportDto,
  ) {
    await this.ensureScope(userId, supplierId, dto.organizationId);
    const existing = await this.prisma.supplierCatalogueImport.findUnique({
      where: { id: importId },
    });
    if (!existing) throw new NotFoundException('Catalogue import not found');
    if (
      existing.supplierId !== supplierId ||
      existing.organizationId !== dto.organizationId
    )
      throw new ForbiddenException(
        'Catalogue import is outside this supplier workspace',
      );
    const candidates = dto.candidates
      ? await this.enrich(
          dto.organizationId,
          supplierId,
          dto.candidates as Candidate[],
        )
      : undefined;
    const status = dto.status;
    return this.prisma.supplierCatalogueImport.update({
      where: { id: importId },
      data: {
        sourceFiles: dto.sourceFiles as Prisma.InputJsonValue | undefined,
        candidates: candidates as Prisma.InputJsonValue | undefined,
        status,
        completedAt:
          status === 'Completed'
            ? new Date()
            : status === 'Review'
              ? null
              : undefined,
      },
    });
  }

  private async enrich(
    organizationId: string,
    supplierId: string,
    candidates: Candidate[],
  ) {
    const existing = await this.prisma.supplierProduct.findMany({
      where: { organizationId, supplierId },
      select: { id: true, productName: true, sku: true },
    });
    return candidates.map((candidate) => {
      const normalizedName = String(candidate.productName ?? '')
        .trim()
        .toLowerCase();
      const normalizedSku = String(candidate.sku ?? '')
        .trim()
        .toLowerCase();
      const duplicate = existing.find(
        (product) =>
          (normalizedSku &&
            product.sku?.trim().toLowerCase() === normalizedSku) ||
          (normalizedName &&
            product.productName.trim().toLowerCase() === normalizedName),
      );
      const confidence = scoreImportCandidate(candidate);
      return {
        ...candidate,
        confidenceScore: confidence.score,
        confidenceWarnings: confidence.warnings,
        duplicateProductId: duplicate?.id,
        duplicateReason: duplicate
          ? normalizedSku &&
            duplicate.sku?.trim().toLowerCase() === normalizedSku
            ? 'Matching SKU already exists.'
            : 'Matching product name already exists.'
          : undefined,
      };
    });
  }

  private async ensureScope(
    userId: string,
    supplierId: string,
    organizationId: string,
  ) {
    const [membership, supplier] = await Promise.all([
      this.prisma.membership.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
      }),
      this.prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { organizationId: true },
      }),
    ]);
    if (!membership)
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    if (!supplier || supplier.organizationId !== organizationId)
      throw new ForbiddenException(
        'Supplier does not belong to this organization',
      );
  }
}
