import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseOrderLineItemDto {
  @IsUUID()
  supplierProductId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vatPercent?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  @MaxLength(80)
  purchaseOrderNumber: string;

  @IsUUID()
  supplierId: string;

  @IsDateString()
  orderDate: string;

  @IsOptional()
  @IsDateString()
  quotationDate?: string;

  @IsOptional()
  @IsDateString()
  validUntilDate?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsUUID()
  deliveryLocationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  supplierReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  internalReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventReference?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineItemDto)
  lineItems: CreatePurchaseOrderLineItemDto[];
}
