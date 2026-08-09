import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceCapabilityService } from './marketplace-capability.service';
import { MarketplacePublicController } from './marketplace-public.controller';
import { MarketplacePublicService } from './marketplace-public.service';
import { AuthModule } from '../auth/auth.module';
import { MarketplaceCustomerController } from './marketplace-customer.controller';
import { MarketplaceCustomerGuard } from './marketplace-customer.guard';
import { MarketplaceCustomerService } from './marketplace-customer.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
  ],
  controllers: [
    MarketplaceController,
    MarketplacePublicController,
    MarketplaceCustomerController,
  ],
  providers: [
    MarketplaceCapabilityService,
    MarketplacePublicService,
    MarketplaceCustomerService,
    MarketplaceCustomerGuard,
  ],
  exports: [MarketplaceCapabilityService, MarketplacePublicService],
})
export class MarketplaceModule {}
