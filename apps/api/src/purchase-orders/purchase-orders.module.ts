import { Module } from '@nestjs/common';
import { AiDraftsModule } from '../ai-drafts/ai-drafts.module';
import { InventoryModule } from '../inventory/inventory.module';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { PurchaseOrderDraftsController } from './purchase-order-drafts.controller';
import {
  PURCHASE_ORDER_QUOTATION_EXTRACTOR,
  PurchaseOrderDraftExtractorService,
} from './purchase-order-draft-extractor.service';
import { PurchaseOrderDraftsService } from './purchase-order-drafts.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [AiDraftsModule, InventoryModule],
  controllers: [
    PurchaseOrdersController,
    PurchaseOrderDraftsController,
    GoodsReceiptsController,
  ],
  providers: [
    PurchaseOrdersService,
    PurchaseOrderDraftsService,
    PurchaseOrderDraftExtractorService,
    {
      provide: PURCHASE_ORDER_QUOTATION_EXTRACTOR,
      useExisting: PurchaseOrderDraftExtractorService,
    },
  ],
})
export class PurchaseOrdersModule {}
