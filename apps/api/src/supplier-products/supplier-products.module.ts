import { Module } from '@nestjs/common';
import { SupplierProductsController } from './supplier-products.controller';
import { SupplierProductsService } from './supplier-products.service';
import { SupplierCatalogueImportsController } from './supplier-catalogue-imports.controller';
import { SupplierCatalogueImportsService } from './supplier-catalogue-imports.service';

@Module({
  controllers: [SupplierProductsController, SupplierCatalogueImportsController],
  providers: [SupplierProductsService, SupplierCatalogueImportsService],
})
export class SupplierProductsModule {}
