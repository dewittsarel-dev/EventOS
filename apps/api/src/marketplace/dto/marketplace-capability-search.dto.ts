import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { MarketplaceCapabilityRequirementDto } from './marketplace-capability-requirement.dto';
import { MarketplaceSearchMode } from './marketplace-search-mode.enum';

export class MarketplaceCapabilitySearchDto {
  @ApiProperty({ type: MarketplaceCapabilityRequirementDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => MarketplaceCapabilityRequirementDto)
  requirement: MarketplaceCapabilityRequirementDto;

  @ApiProperty({
    enum: MarketplaceSearchMode,
    example: MarketplaceSearchMode.AI_ASSISTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(MarketplaceSearchMode)
  searchMode?: MarketplaceSearchMode;
}

export class MarketplaceSupplierShortfallRequestDto extends MarketplaceCapabilitySearchDto {
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Primary supplier receiving the buyer RFQ.',
  })
  @IsUUID()
  primarySupplierId: string;
}
