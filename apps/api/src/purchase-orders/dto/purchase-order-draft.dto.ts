import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PurchaseOrderDraftFieldDecisionDto {
  Suggested = 'Suggested',
  Accepted = 'Accepted',
  Edited = 'Edited',
  Ignored = 'Ignored',
  Manual = 'Manual',
}

export class CreatePurchaseOrderDraftDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  sourceText?: string;
}

export class PurchaseOrderDraftHeaderDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  purchaseOrderNumber?: string | null;

  @IsOptional()
  @IsString()
  orderDate?: string | null;

  @IsOptional()
  @IsString()
  quotationDate?: string | null;

  @IsOptional()
  @IsString()
  validUntilDate?: string | null;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string | null;

  @IsOptional()
  @IsString()
  supplierId?: string | null;

  @IsOptional()
  @IsString()
  supplierName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  supplierReference?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  internalReference?: string | null;

  @IsOptional()
  @IsString()
  deliveryLocationId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  deliveryAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  paymentTerms?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventReference?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  extractedTotal?: number | null;
}

export class PurchaseOrderDraftLineItemDto {
  @IsString()
  id: string;

  @IsString()
  @MaxLength(250)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string | null;

  @IsOptional()
  @IsString()
  supplierProductId?: string | null;

  @IsOptional()
  @IsString()
  inventoryItemId?: string | null;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPercent?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vatPercent?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class PurchaseOrderDraftFieldReviewDto {
  @IsString()
  fieldPath: string;

  @IsEnum(PurchaseOrderDraftFieldDecisionDto)
  decision: PurchaseOrderDraftFieldDecisionDto;

  @IsOptional()
  finalValue?: unknown;
}

export class UpdatePurchaseOrderDraftReviewDto {
  @ValidateNested()
  @Type(() => PurchaseOrderDraftHeaderDto)
  header: PurchaseOrderDraftHeaderDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDraftLineItemDto)
  lineItems: PurchaseOrderDraftLineItemDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDraftFieldReviewDto)
  fields: PurchaseOrderDraftFieldReviewDto[];
}
