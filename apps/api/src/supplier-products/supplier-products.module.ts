import { Module } from '@nestjs/common';
import { SupplierProductsController } from './supplier-products.controller';
import { SupplierProductsService } from './supplier-products.service';

@Module({
  controllers: [SupplierProductsController],
  providers: [SupplierProductsService],
})
export class SupplierProductsModule {}
