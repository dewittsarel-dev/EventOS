import { Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';

@Module({
  imports: [MarketplaceModule],
  controllers: [ProcurementController],
  providers: [ProcurementService],
})
export class ProcurementModule {}
