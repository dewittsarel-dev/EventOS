import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    await this.prisma.supplierProduct.delete({
      where: { id: productId },
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
      brand: product.brand,
      description: product.description,
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      vatPercent: product.vatPercent,
      leadTimeDays: product.leadTimeDays,
      minimumOrderQuantity: product.minimumOrderQuantity,
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
