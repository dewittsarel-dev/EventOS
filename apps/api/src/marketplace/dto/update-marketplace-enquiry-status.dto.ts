import { MarketplaceEnquiryStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class UpdateMarketplaceEnquiryStatusDto {
  @IsUUID()
  organizationId!: string;

  @IsEnum(MarketplaceEnquiryStatus)
  status!: MarketplaceEnquiryStatus;
}
