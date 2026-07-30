import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

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
}
