import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FindSuppliersQueryDto } from './dto/find-suppliers-query.dto';
import { SupplierSortBy } from './dto/supplier-sort.enum';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly supplierInclude = {
    organization: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const;

  async create(userId: string, data: CreateSupplierDto) {
    await this.ensureOrganizationAccess(userId, data.organizationId);

    const companyName = this.normalizeRequiredString(data.companyName);
    const vatNumber = this.normalizeNullableString(data.vatNumber);
    const registrationNumber = this.normalizeNullableString(
      data.registrationNumber,
    );

    await this.ensureUniqueIdentifiers(data.organizationId, {
      vatNumber,
      registrationNumber,
    });

    const created = await this.prisma.supplier.create({
      data: {
        organizationId: data.organizationId,
        companyName,
        category: data.category,
        primaryContactName: this.normalizeNullableString(
          data.primaryContactName,
        ),
        phone: this.normalizeNullableString(data.phone),
        mobile: this.normalizeNullableString(data.mobile),
        email: this.normalizeNullableString(data.email),
        website: this.normalizeNullableString(data.website),
        physicalAddress: this.normalizeNullableString(data.physicalAddress),
        city: this.normalizeNullableString(data.city),
        province: this.normalizeNullableString(data.province),
        postalCode: this.normalizeNullableString(data.postalCode),
        vatNumber,
        registrationNumber,
        preferredSupplier: data.preferredSupplier ?? false,
        active: data.active ?? true,
        preferredPaymentTerms: this.normalizeNullableString(
          data.preferredPaymentTerms,
        ),
        internalRating: data.internalRating,
        notes: this.normalizeNullableString(data.notes),
      },
      include: this.supplierInclude,
    });

    return this.mapSupplier(created);
  }

  async findAll(userId: string, query: FindSuppliersQueryDto) {
    await this.ensureOrganizationAccess(userId, query.organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.SupplierWhereInput = {
      organizationId: query.organizationId,
      ...(query.search
        ? {
            OR: [
              {
                companyName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                primaryContactName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                phone: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                mobile: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                city: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(query.category
        ? {
            category: query.category,
          }
        : {}),
      ...(query.preferredSupplier !== undefined
        ? { preferredSupplier: query.preferredSupplier }
        : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const sortBy = query.sortBy ?? SupplierSortBy.CompanyName;
    const orderBy = this.resolveOrderBy(sortBy);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: this.supplierInclude,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: data.map((supplier) => this.mapSupplier(supplier)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: this.supplierInclude,
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, supplier.organizationId);

    return this.mapSupplier(supplier);
  }

  async update(userId: string, id: string, data: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, supplier.organizationId);

    const vatNumber =
      data.vatNumber !== undefined
        ? this.normalizeNullableString(data.vatNumber)
        : undefined;
    const registrationNumber =
      data.registrationNumber !== undefined
        ? this.normalizeNullableString(data.registrationNumber)
        : undefined;

    await this.ensureUniqueIdentifiers(
      supplier.organizationId,
      {
        vatNumber,
        registrationNumber,
      },
      supplier.id,
    );

    const updateData: Prisma.SupplierUpdateInput = {};

    if (data.companyName !== undefined) {
      updateData.companyName = this.normalizeRequiredString(data.companyName);
    }

    if (data.category !== undefined) {
      updateData.category = data.category;
    }

    if (data.primaryContactName !== undefined) {
      updateData.primaryContactName = this.normalizeNullableString(
        data.primaryContactName,
      );
    }

    if (data.phone !== undefined) {
      updateData.phone = this.normalizeNullableString(data.phone);
    }

    if (data.mobile !== undefined) {
      updateData.mobile = this.normalizeNullableString(data.mobile);
    }

    if (data.email !== undefined) {
      updateData.email = this.normalizeNullableString(data.email);
    }

    if (data.website !== undefined) {
      updateData.website = this.normalizeNullableString(data.website);
    }

    if (data.physicalAddress !== undefined) {
      updateData.physicalAddress = this.normalizeNullableString(
        data.physicalAddress,
      );
    }

    if (data.city !== undefined) {
      updateData.city = this.normalizeNullableString(data.city);
    }

    if (data.province !== undefined) {
      updateData.province = this.normalizeNullableString(data.province);
    }

    if (data.postalCode !== undefined) {
      updateData.postalCode = this.normalizeNullableString(data.postalCode);
    }

    if (data.vatNumber !== undefined) {
      updateData.vatNumber = vatNumber;
    }

    if (data.registrationNumber !== undefined) {
      updateData.registrationNumber = registrationNumber;
    }

    if (data.preferredSupplier !== undefined) {
      updateData.preferredSupplier = data.preferredSupplier;
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    if (data.preferredPaymentTerms !== undefined) {
      updateData.preferredPaymentTerms = this.normalizeNullableString(
        data.preferredPaymentTerms,
      );
    }

    if (data.internalRating !== undefined) {
      updateData.internalRating = data.internalRating;
    }

    if (data.notes !== undefined) {
      updateData.notes = this.normalizeNullableString(data.notes);
    }

    const updated = await this.prisma.supplier.update({
      where: { id: supplier.id },
      data: updateData,
      include: this.supplierInclude,
    });

    return this.mapSupplier(updated);
  }

  async remove(userId: string, id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, supplier.organizationId);

    await this.ensureSupplierCanBeDeleted(supplier.organizationId, supplier.id);

    await this.prisma.supplier.delete({ where: { id: supplier.id } });
  }

  async archive(userId: string, id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, supplier.organizationId);

    const archived = await this.prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        active: false,
      },
      include: this.supplierInclude,
    });

    return this.mapSupplier(archived);
  }

  private resolveOrderBy(
    sortBy: SupplierSortBy,
  ): Prisma.SupplierOrderByWithRelationInput[] {
    if (sortBy === SupplierSortBy.Newest) {
      return [{ createdAt: 'desc' }];
    }

    if (sortBy === SupplierSortBy.Oldest) {
      return [{ createdAt: 'asc' }];
    }

    if (sortBy === SupplierSortBy.Rating) {
      return [{ internalRating: 'desc' }, { companyName: 'asc' }];
    }

    return [{ companyName: 'asc' }];
  }

  private mapSupplier(
    supplier: Prisma.SupplierGetPayload<{
      include: {
        organization: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    }>,
  ) {
    return {
      ...supplier,
      organizationName: supplier.organization.name,
    };
  }

  private normalizeRequiredString(value: string) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Company name is required');
    }

    return trimmed;
  }

  private normalizeNullableString(value: string | null | undefined) {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
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

  private async ensureUniqueIdentifiers(
    organizationId: string,
    identifiers: {
      vatNumber?: string | null;
      registrationNumber?: string | null;
    },
    ignoreSupplierId?: string,
  ) {
    if (identifiers.vatNumber) {
      const duplicateVat = await this.prisma.supplier.findFirst({
        where: {
          organizationId,
          vatNumber: {
            equals: identifiers.vatNumber,
            mode: 'insensitive',
          },
          ...(ignoreSupplierId
            ? {
                id: {
                  not: ignoreSupplierId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (duplicateVat) {
        throw new ConflictException(
          'VAT number already exists for this organization',
        );
      }
    }

    if (identifiers.registrationNumber) {
      const duplicateRegistration = await this.prisma.supplier.findFirst({
        where: {
          organizationId,
          registrationNumber: {
            equals: identifiers.registrationNumber,
            mode: 'insensitive',
          },
          ...(ignoreSupplierId
            ? {
                id: {
                  not: ignoreSupplierId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (duplicateRegistration) {
        throw new ConflictException(
          'Registration number already exists for this organization',
        );
      }
    }
  }

  private async ensureSupplierCanBeDeleted(
    organizationId: string,
    supplierId: string,
  ) {
    const [
      purchaseOrderCount,
      preferredInventoryItemCount,
      quotationLinkCount,
    ] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.count({
        where: {
          organizationId,
          supplierId,
        },
      }),
      this.prisma.inventoryItem.count({
        where: {
          organizationId,
          preferredSupplierId: supplierId,
        },
      }),
      this.prisma.supplierQuotation.count({
        where: {
          supplierId,
        },
      }),
    ]);

    if (
      purchaseOrderCount > 0 ||
      preferredInventoryItemCount > 0 ||
      quotationLinkCount > 0
    ) {
      throw new ConflictException(
        'Supplier cannot be deleted because it is referenced by purchase orders, inventory, or quotations. Archive the supplier instead.',
      );
    }
  }
}
