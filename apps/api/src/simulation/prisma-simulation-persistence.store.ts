import {
  ResourceCondition,
  ResourceType,
  ResourceVisibility,
  SupplierCategory,
  SupplierProductCategory,
  SupplierProductUnit,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SimulationBusinessProfile } from './simulation-business-catalog';
import { SimulationCatalogueItem } from './simulation-fixtures';
import { SimulationPersistenceStore } from './simulation-persistence';

export class PrismaSimulationPersistenceStore implements SimulationPersistenceStore {
  constructor(private readonly prisma: PrismaService) {}

  async upsertBusiness(
    business: SimulationBusinessProfile,
    catalogue: readonly SimulationCatalogueItem[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.upsert({
        where: { slug: business.slug },
        create: {
          id: business.id,
          name: business.name,
          tradingName: business.name,
          slug: business.slug,
          physicalAddress: `${business.city} [SYNTHETIC]`,
          website: 'https://example.invalid/eventos-simulation',
        },
        update: {
          name: business.name,
          tradingName: business.name,
          physicalAddress: `${business.city} [SYNTHETIC]`,
        },
      });
      const supplier = await tx.supplier.upsert({
        where: { id: `${business.id}-SUP` },
        create: {
          id: `${business.id}-SUP`,
          organizationId: organization.id,
          companyName: business.name,
          category: SupplierCategory.Other,
          city: business.city,
          notes: 'EVENTOS_SIMULATOR_OWNED — never use as a real supplier.',
        },
        update: {
          companyName: business.name,
          city: business.city,
          active: true,
          notes: 'EVENTOS_SIMULATOR_OWNED — never use as a real supplier.',
        },
      });
      for (const item of catalogue) {
        await tx.supplierProduct.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            organizationId: organization.id,
            supplierId: supplier.id,
            productName: item.name,
            sku: item.sku,
            category: this.productCategory(business),
            description: item.description,
            unit: this.productUnit(item),
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            notes: 'EVENTOS_SIMULATOR_OWNED',
          },
          update: {
            productName: item.name,
            description: item.description,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            active: true,
            notes: 'EVENTOS_SIMULATOR_OWNED',
          },
        });
        await tx.resource.upsert({
          where: { id: `${item.id}-RES` },
          create: {
            id: `${item.id}-RES`,
            organizationId: organization.id,
            supplierId: supplier.id,
            name: item.name,
            description: item.description,
            category: item.category,
            tags: [
              'synthetic',
              business.kind.toLowerCase(),
              business.scale.toLowerCase(),
            ],
            keywords: business.catalogueFocus.map((value) =>
              value.toLowerCase(),
            ),
            imageUrls: [item.imagePath],
            resourceType: this.resourceType(business),
            quantityMode: item.quantityMode,
            sku: item.sku,
            visibility: ResourceVisibility.MARKETPLACE,
            unit: item.unit,
            totalQuantity: item.quantity,
            condition: ResourceCondition.EXCELLENT,
            purchaseValue: item.costPrice,
            replacementValue: item.costPrice,
            rentalPrice: item.sellingPrice,
            notes: 'EVENTOS_SIMULATOR_OWNED — synthetic listing.',
          },
          update: {
            name: item.name,
            description: item.description,
            imageUrls: [item.imagePath],
            quantityMode: item.quantityMode,
            visibility: ResourceVisibility.MARKETPLACE,
            totalQuantity: item.quantity,
            rentalPrice: item.sellingPrice,
            archivedAt: null,
            notes: 'EVENTOS_SIMULATOR_OWNED — synthetic listing.',
          },
        });
      }
    });
  }

  async deleteBusinessesByExactSlugs(
    slugs: readonly string[],
  ): Promise<number> {
    const result = await this.prisma.organization.deleteMany({
      where: { slug: { in: [...slugs] } },
    });
    return result.count;
  }

  private resourceType(business: SimulationBusinessProfile): ResourceType {
    if (business.kind === 'Venue') return ResourceType.VENUE;
    if (business.kind === 'Planner' || business.kind === 'Specialist')
      return ResourceType.SERVICE;
    return ResourceType.ASSET;
  }

  private productCategory(
    business: SimulationBusinessProfile,
  ): SupplierProductCategory {
    if (business.kind === 'Venue') return SupplierProductCategory.Venue;
    if (business.kind === 'Planner' || business.kind === 'Specialist')
      return SupplierProductCategory.Service;
    return SupplierProductCategory.Other;
  }

  private productUnit(item: SimulationCatalogueItem): SupplierProductUnit {
    if (item.unit === 'Day') return SupplierProductUnit.Day;
    if (item.unit === 'Hour') return SupplierProductUnit.Hour;
    if (item.unit === 'Service') return SupplierProductUnit.Service;
    return SupplierProductUnit.Each;
  }
}
