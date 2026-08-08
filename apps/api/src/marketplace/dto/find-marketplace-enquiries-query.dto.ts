import { IsUUID } from 'class-validator';

export class FindMarketplaceEnquiriesQueryDto {
  @IsUUID()
  organizationId!: string;
}
