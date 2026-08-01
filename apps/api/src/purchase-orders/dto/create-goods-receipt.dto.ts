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

export class CreateGoodsReceiptLineDto {
  @IsUUID()
  purchaseOrderLineItemId: string;

  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0001)
  quantityReceived: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantityAccepted: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantityDamaged: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  purchaseOrderId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  receiptNumber?: string;

  @IsDateString()
  receivedDate: string;

  @IsUUID()
  storageLocationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  supplierDeliveryNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptLineDto)
  lines: CreateGoodsReceiptLineDto[];
}
