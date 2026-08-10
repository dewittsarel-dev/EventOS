import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ResourceCondition,
  ResourceQuantityMode,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
  SupplierProductPublicationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierProductDto } from './dto/create-supplier-product.dto';
import { FindSupplierProductsQueryDto } from './dto/find-supplier-products-query.dto';
import { SupplierProductSortBy } from './dto/supplier-product-sort.enum';
import { UpdateSupplierProductDto } from './dto/update-supplier-product.dto';

const supplierProductInclude = {
  supplier: {
    select: {
      id: true,
      companyName: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

type SupplierProductWithRelations = Prisma.SupplierProductGetPayload<{
  include: typeof supplierProductInclude;
}>;

type MarketplaceProjectionProduct = {
  organizationId: string;
  supplierId: string;
  productName: string;
  category: string;
  subcategory: string | null;
  marketplaceDescription: string | null;
  description: string | null;
  tags: string[];
  searchTerms: string[];
  imageUrls: string[];
  availability: string;
  unit: string;
  totalQuantity: number | null;
  condition: string | null;
  sellingPrice: number | null;
};

function resourceTypeFor(category: string): ResourceType {
  if (category === 'Service') return ResourceType.SERVICE;
  if (category === 'Venue') return ResourceType.VENUE;
  if (category === 'Transport') return ResourceType.VEHICLE;
  if (category === 'Consumable') return ResourceType.CONSUMABLE;
  return ResourceType.BULK_ITEM;
}

function resourceConditionFor(condition?: string | null): ResourceCondition {
  const value = (condition ?? '').toUpperCase();
  return Object.values(ResourceCondition).includes(value as ResourceCondition)
    ? (value as ResourceCondition)
    : ResourceCondition.UNKNOWN;
}

export function buildMarketplaceProjection(
  product: MarketplaceProjectionProduct,
) {
  const resourceType = resourceTypeFor(product.category);
  return {
    organizationId: product.organizationId,
    supplierId: product.supplierId,
    name: product.productName,
    description: product.marketplaceDescription || product.description,
    category: product.subcategory || product.category,
    tags: product.tags,
    keywords: product.searchTerms,
    aiSummary: product.marketplaceDescription || product.description,
    searchPhrases: product.searchTerms,
    imageUrls: product.imageUrls,
    resourceType,
    quantityMode:
      resourceType === ResourceType.SERVICE
        ? ResourceQuantityMode.UNLIMITED
        : resourceType === ResourceType.VENUE
          ? ResourceQuantityMode.CAPACITY
          : ResourceQuantityMode.QUANTITY,
    status:
      product.availability === 'Unavailable'
        ? ResourceStatus.RESERVED
        : ResourceStatus.AVAILABLE,
    visibility: ResourceVisibility.MARKETPLACE,
    unit: product.unit,
    totalQuantity: product.totalQuantity,
    condition: resourceConditionFor(product.condition),
    rentalPrice: product.sellingPrice,
  };
}

@Injectable()
export class SupplierProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    supplierId: string,
    dto: CreateSupplierProductDto,
  ) {
    await this.ensureOrganizationAccess(userId, dto.organizationId);
    await this.ensureSupplierOwnership(supplierId, dto.organizationId);

    try {
      const created = await this.prisma.supplierProduct.create({
        data: {
          organizationId: dto.organizationId,
          supplierId,
          productName: dto.productName.trim(),
          sku: this.normalizeNullable(dto.sku),
          category: dto.category,
          subcategory: this.normalizeNullable(dto.subcategory),
          attributes: dto.attributes ?? undefined,
          condition: this.normalizeNullable(dto.condition),
          brand: this.normalizeNullable(dto.brand),
          description: this.normalizeNullable(dto.description),
          unit: dto.unit,
          costPrice: dto.costPrice,
          sellingPrice:
            dto.sellingPrice === undefined ? null : dto.sellingPrice,
          vatPercent: dto.vatPercent === undefined ? null : dto.vatPercent,
          leadTimeDays:
            dto.leadTimeDays === undefined ? null : dto.leadTimeDays,
          minimumOrderQuantity:
            dto.minimumOrderQuantity === undefined
              ? null
              : dto.minimumOrderQuantity,
          totalQuantity: dto.totalQuantity ?? null,
          availability: dto.availability,
          deliveryAvailable: dto.deliveryAvailable ?? false,
          pickupAvailable: dto.pickupAvailable ?? true,
          deliveryRadiusKm: dto.deliveryRadiusKm ?? null,
          deliveryFee: dto.deliveryFee ?? null,
          tags: this.cleanTerms(dto.tags),
          searchTerms: this.cleanTerms(dto.searchTerms),
          marketplaceDescription: this.normalizeNullable(
            dto.marketplaceDescription,
          ),
          imageUrls: this.cleanTerms(dto.imageUrls),
          preferredProduct: dto.preferredProduct ?? false,
          active: dto.active ?? true,
          notes: this.normalizeNullable(dto.notes),
        },
        include: supplierProductInclude,
      });

      return this.mapProduct(created);
    } catch (error: unknown) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async findAll(
    userId: string,
    supplierId: string,
    query: FindSupplierProductsQueryDto,
  ) {
    await this.ensureOrganizationAccess(userId, query.organizationId);
    await this.ensureSupplierOwnership(supplierId, query.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.SupplierProductWhereInput = {
      organizationId: query.organizationId,
      supplierId,
      ...(query.search
        ? {
            OR: [
              {
                productName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                sku: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                brand: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.active === undefined ? {} : { active: query.active }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.supplierProduct.findMany({
        where,
        orderBy: this.resolveOrderBy(
          query.sortBy ?? SupplierProductSortBy.ProductName,
        ),
        skip: (page - 1) * limit,
        take: limit,
        include: supplierProductInclude,
      }),
      this.prisma.supplierProduct.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapProduct(row)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    await this.ensureOrganizationAccess(userId, organizationId);

    const product = await this.prisma.supplierProduct.findUnique({
      where: { id: productId },
      include: supplierProductInclude,
    });

    if (!product) {
      throw new NotFoundException(
        `Supplier product with id ${productId} not found`,
      );
    }

    this.ensureProductScope(product, supplierId, organizationId);

    return this.mapProduct(product);
  }

  async update(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
    dto: UpdateSupplierProductDto,
  ) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.ensureSupplierOwnership(supplierId, organizationId);

    const existing = await this.prisma.supplierProduct.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Supplier product with id ${productId} not found`,
      );
    }

    this.ensureProductScope(existing, supplierId, organizationId);

    try {
      const updated = await this.prisma.supplierProduct.update({
        where: { id: productId },
        data: {
          ...(dto.productName === undefined
            ? {}
            : { productName: dto.productName.trim() }),
          ...(dto.sku === undefined
            ? {}
            : { sku: this.normalizeNullable(dto.sku) }),
          ...(dto.category === undefined ? {} : { category: dto.category }),
          ...(dto.subcategory === undefined
            ? {}
            : { subcategory: this.normalizeNullable(dto.subcategory) }),
          ...(dto.attributes === undefined
            ? {}
            : { attributes: dto.attributes ?? Prisma.JsonNull }),
          ...(dto.condition === undefined
            ? {}
            : { condition: this.normalizeNullable(dto.condition) }),
          ...(dto.brand === undefined
            ? {}
            : { brand: this.normalizeNullable(dto.brand) }),
          ...(dto.description === undefined
            ? {}
            : { description: this.normalizeNullable(dto.description) }),
          ...(dto.unit === undefined ? {} : { unit: dto.unit }),
          ...(dto.costPrice === undefined ? {} : { costPrice: dto.costPrice }),
          ...(dto.sellingPrice === undefined
            ? {}
            : { sellingPrice: dto.sellingPrice }),
          ...(dto.vatPercent === undefined
            ? {}
            : { vatPercent: dto.vatPercent }),
          ...(dto.leadTimeDays === undefined
            ? {}
            : { leadTimeDays: dto.leadTimeDays }),
          ...(dto.minimumOrderQuantity === undefined
            ? {}
            : { minimumOrderQuantity: dto.minimumOrderQuantity }),
          ...(dto.totalQuantity === undefined
            ? {}
            : { totalQuantity: dto.totalQuantity }),
          ...(dto.availability === undefined
            ? {}
            : { availability: dto.availability }),
          ...(dto.deliveryAvailable === undefined
            ? {}
            : { deliveryAvailable: dto.deliveryAvailable }),
          ...(dto.pickupAvailable === undefined
            ? {}
            : { pickupAvailable: dto.pickupAvailable }),
          ...(dto.deliveryRadiusKm === undefined
            ? {}
            : { deliveryRadiusKm: dto.deliveryRadiusKm }),
          ...(dto.deliveryFee === undefined
            ? {}
            : { deliveryFee: dto.deliveryFee }),
          ...(dto.tags === undefined
            ? {}
            : { tags: this.cleanTerms(dto.tags) }),
          ...(dto.searchTerms === undefined
            ? {}
            : { searchTerms: this.cleanTerms(dto.searchTerms) }),
          ...(dto.marketplaceDescription === undefined
            ? {}
            : {
                marketplaceDescription: this.normalizeNullable(
                  dto.marketplaceDescription,
                ),
              }),
          ...(dto.imageUrls === undefined
            ? {}
            : { imageUrls: this.cleanTerms(dto.imageUrls) }),
          ...(dto.preferredProduct === undefined
            ? {}
            : { preferredProduct: dto.preferredProduct }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
          ...(dto.notes === undefined
            ? {}
            : { notes: this.normalizeNullable(dto.notes) }),
        },
        include: supplierProductInclude,
      });

      if (
        updated.publicationStatus === SupplierProductPublicationStatus.Published
      ) {
        await this.syncMarketplaceProjection(updated);
      }
      return this.mapProduct(updated);
    } catch (error: unknown) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async archive(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    return this.update(userId, supplierId, productId, organizationId, {
      active: false,
    });
  }

  async restore(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    return this.update(userId, supplierId, productId, organizationId, {
      active: true,
    });
  }

  async submitForReview(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    const product = await this.getScopedProduct(
      userId,
      supplierId,
      productId,
      organizationId,
    );
    this.assertPublishable(product);
    const updated = await this.prisma.supplierProduct.update({
      where: { id: productId },
      data: {
        publicationStatus: SupplierProductPublicationStatus.Review,
        submittedForReviewAt: new Date(),
      },
      include: supplierProductInclude,
    });
    return this.mapProduct(updated);
  }

  async publish(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    const product = await this.getScopedProduct(
      userId,
      supplierId,
      productId,
      organizationId,
    );
    this.assertPublishable(product);
    const resourceId = await this.syncMarketplaceProjection(product);
    const updated = await this.prisma.supplierProduct.update({
      where: { id: productId },
      data: {
        marketplaceResourceId: resourceId,
        publicationStatus: SupplierProductPublicationStatus.Published,
        publishedAt: new Date(),
        withdrawnAt: null,
      },
      include: supplierProductInclude,
    });
    return this.mapProduct(updated);
  }

  async withdraw(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    const product = await this.getScopedProduct(
      userId,
      supplierId,
      productId,
      organizationId,
    );
    if (product.marketplaceResourceId) {
      await this.prisma.resource.update({
        where: { id: product.marketplaceResourceId },
        data: { visibility: ResourceVisibility.HIDDEN },
      });
    }
    const updated = await this.prisma.supplierProduct.update({
      where: { id: productId },
      data: {
        publicationStatus: SupplierProductPublicationStatus.Withdrawn,
        withdrawnAt: new Date(),
      },
      include: supplierProductInclude,
    });
    return this.mapProduct(updated);
  }

  async remove(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.ensureAdminPermission(userId, organizationId);

    const existing = await this.prisma.supplierProduct.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Supplier product with id ${productId} not found`,
      );
    }

    this.ensureProductScope(existing, supplierId, organizationId);

    await this.prisma.$transaction(async (tx) => {
      await tx.supplierProduct.delete({ where: { id: productId } });
      if (existing.marketplaceResourceId)
        await tx.resource.delete({
          where: { id: existing.marketplaceResourceId },
        });
    });
  }

  private ensureProductScope(
    product: {
      organizationId: string;
      supplierId: string;
    },
    supplierId: string,
    organizationId: string,
  ) {
    if (
      product.supplierId !== supplierId ||
      product.organizationId !== organizationId
    ) {
      throw new ForbiddenException(
        'Supplier product does not belong to this supplier or organization',
      );
    }
  }

  private resolveOrderBy(sortBy: SupplierProductSortBy) {
    if (sortBy === SupplierProductSortBy.Newest) {
      return [{ createdAt: 'desc' as const }];
    }

    if (sortBy === SupplierProductSortBy.Oldest) {
      return [{ createdAt: 'asc' as const }];
    }

    if (sortBy === SupplierProductSortBy.CostPrice) {
      return [{ costPrice: 'desc' as const }, { productName: 'asc' as const }];
    }

    if (sortBy === SupplierProductSortBy.LeadTime) {
      return [
        { leadTimeDays: 'asc' as const },
        { productName: 'asc' as const },
      ];
    }

    return [{ productName: 'asc' as const }];
  }

  private mapProduct(product: SupplierProductWithRelations) {
    return {
      id: product.id,
      organizationId: product.organizationId,
      supplierId: product.supplierId,
      productName: product.productName,
      sku: product.sku,
      category: product.category,
      subcategory: product.subcategory,
      attributes: product.attributes,
      condition: product.condition,
      brand: product.brand,
      description: product.description,
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      vatPercent: product.vatPercent,
      leadTimeDays: product.leadTimeDays,
      minimumOrderQuantity: product.minimumOrderQuantity,
      totalQuantity: product.totalQuantity,
      availability: product.availability,
      deliveryAvailable: product.deliveryAvailable,
      pickupAvailable: product.pickupAvailable,
      deliveryRadiusKm: product.deliveryRadiusKm,
      deliveryFee: product.deliveryFee,
      tags: product.tags,
      searchTerms: product.searchTerms,
      marketplaceDescription: product.marketplaceDescription,
      imageUrls: product.imageUrls,
      publicationStatus: product.publicationStatus,
      marketplaceResourceId: product.marketplaceResourceId,
      submittedForReviewAt: product.submittedForReviewAt,
      publishedAt: product.publishedAt,
      withdrawnAt: product.withdrawnAt,
      preferredProduct: product.preferredProduct,
      active: product.active,
      notes: product.notes,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      supplierName: String(product.supplier.companyName),
      organizationName: String(product.organization.name),
    };
  }

  private normalizeNullable(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private cleanTerms(values?: string[]) {
    return [
      ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
    ];
  }

  private async getScopedProduct(
    userId: string,
    supplierId: string,
    productId: string,
    organizationId: string,
  ) {
    await this.ensureOrganizationAccess(userId, organizationId);
    const product = await this.prisma.supplierProduct.findUnique({
      where: { id: productId },
    });
    if (!product)
      throw new NotFoundException(
        `Supplier product with id ${productId} not found`,
      );
    this.ensureProductScope(product, supplierId, organizationId);
    return product;
  }

  private assertPublishable(product: {
    productName: string;
    subcategory: string | null;
    marketplaceDescription: string | null;
    description: string | null;
    sellingPrice: number | null;
    imageUrls: string[];
  }) {
    const missing = [
      !product.productName && 'product name',
      !product.subcategory && 'subcategory',
      !(product.marketplaceDescription || product.description) &&
        'Marketplace description',
      product.sellingPrice === null && 'selling price',
      product.imageUrls.length === 0 && 'at least one image',
    ].filter(Boolean);
    if (missing.length)
      throw new BadRequestException(
        `Complete before publication: ${missing.join(', ')}`,
      );
  }

  private async syncMarketplaceProjection(
    product: MarketplaceProjectionProduct & {
      marketplaceResourceId: string | null;
    },
  ) {
    const data = buildMarketplaceProjection(product);
    if (product.marketplaceResourceId) {
      await this.prisma.resource.update({
        where: { id: product.marketplaceResourceId },
        data,
      });
      return product.marketplaceResourceId;
    }
    const created = await this.prisma.resource.create({ data });
    return created.id;
  }

  private async ensureSupplierOwnership(
    supplierId: string,
    organizationId: string,
  ) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!supplier || supplier.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Supplier does not belong to this organization',
      );
    }
  }

  private async ensureOrganizationAccess(
    userId: string,
    organizationId: string,
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
  }

  private async ensureAdminPermission(userId: string, organizationId: string) {
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

    throw new ForbiddenException(
      'Only organization administrators can delete supplier products',
    );
  }

  private handleUniqueError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('SKU already exists in this organization');
    }
  }
}
