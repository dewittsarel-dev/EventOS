import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceCapabilityService } from './marketplace-capability.service';
import { MarketplacePublicController } from './marketplace-public.controller';
import { MarketplacePublicService } from './marketplace-public.service';

@Module({
  controllers: [MarketplaceController, MarketplacePublicController],
  providers: [MarketplaceCapabilityService, MarketplacePublicService],
  exports: [MarketplaceCapabilityService, MarketplacePublicService],
})
export class MarketplaceModule {}
