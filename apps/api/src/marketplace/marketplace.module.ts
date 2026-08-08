import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceCapabilityService } from './marketplace-capability.service';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceCapabilityService],
  exports: [MarketplaceCapabilityService],
})
export class MarketplaceModule {}
