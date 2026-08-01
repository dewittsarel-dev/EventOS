import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PurchaseOrderSortBy } from './purchase-order-sort.enum';
import { PurchaseOrderStatus } from './purchase-order-status.enum';

function toNumber(value: unknown) {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value: unknown) {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return undefined;
}

export class FindPurchaseOrdersQueryDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  search?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsDateString()
  orderDateFrom?: string;

  @IsOptional()
  @IsDateString()
  orderDateTo?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryFrom?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryTo?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  overdueOnly?: boolean;

  @IsOptional()
  @IsEnum(PurchaseOrderSortBy)
  sortBy?: PurchaseOrderSortBy;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
