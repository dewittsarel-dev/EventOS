import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class QuotationLineItemDto {
  @ApiProperty({
    example: 'Venue setup and decor',
    description: 'Line item description',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity for the line item',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 150000,
    description: 'Unit price in cents',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  unitPriceCents: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Discount percentage applied to this line item',
    minimum: 0,
    maximum: 100,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Legacy discount amount in cents applied to this line item',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;
}
