import {
  FinanceCloseStatus,
  FinanceCommitmentStatus,
  FinanceInvoiceStatus,
  FinanceLineType,
  FinancePaymentDirection,
  FinancePaymentStatus,
  FinanceReconciliationStatus,
  FinanceValueStage,
  FinanceVersionStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateFinanceWorkspaceDto {
  @IsOptional() @IsString() @MaxLength(8) currency?: string;
  @IsOptional() @IsObject() profitabilityPolicy?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(120) statutorySystemName?: string;
}

export class AssignFinanceOwnerDto {
  @IsString() @MaxLength(120) role: string;
  @IsUUID() ownerUserId: string;
}

export class CreateFinanceWbsDto {
  @IsOptional() @IsUUID() parentId?: string;
  @IsString() @MaxLength(80) code: string;
  @IsString() @MaxLength(240) name: string;
  @IsOptional() @IsString() @MaxLength(120) costCentre?: string;
  @IsOptional() @IsString() @MaxLength(120) profitCentre?: string;
}

export class FinancialLineDto {
  @IsUUID() wbsNodeId: string;
  @IsOptional() @IsUUID() requirementItemId?: string;
  @IsEnum(FinanceLineType) lineType: FinanceLineType;
  @IsEnum(FinanceValueStage) stage: FinanceValueStage;
  @IsString() @MaxLength(1000) description: string;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  @IsNumber() unitAmount: number;
  @IsOptional() @IsNumber() taxAmount?: number;
  @IsString() @MaxLength(8) currency: string;
  @IsString() @MaxLength(80) sourceModule: string;
  @IsString() @MaxLength(80) sourceType: string;
  @IsString() @MaxLength(120) sourceId: string;
  @IsOptional() @IsString() @MaxLength(180) externalAccountingId?: string;
  @IsOptional() @IsDateString() occurredAt?: string;
}

export class BudgetLineDto {
  @IsUUID() wbsNodeId: string;
  @IsOptional() @IsUUID() requirementItemId?: string;
  @IsEnum(FinanceLineType) lineType: FinanceLineType;
  @IsString() @MaxLength(1000) description: string;
  @IsNumber() amount: number;
  @IsString() @MaxLength(8) currency: string;
  @IsOptional() @IsString() @MaxLength(80) sourceType?: string;
  @IsOptional() @IsString() @MaxLength(120) sourceId?: string;
}

export class CreateBudgetVersionDto {
  @IsString() @MaxLength(80) versionType: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines: BudgetLineDto[];
}

export class ChangeBudgetStatusDto {
  @IsEnum(FinanceVersionStatus) status: FinanceVersionStatus;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}

export class CreateFinancialChangeDto {
  @IsString() @MaxLength(100) changeType: string;
  @IsString() @MaxLength(80) sourceModule: string;
  @IsString() @MaxLength(80) sourceType: string;
  @IsString() @MaxLength(120) sourceId: string;
  @IsString() @MaxLength(2000) description: string;
  @IsOptional() @IsNumber() revenueImpact?: number;
  @IsOptional() @IsNumber() costImpact?: number;
  @IsOptional() @IsNumber() forecastImpact?: number;
}

export class CreateCommitmentDto {
  @IsOptional() @IsUUID() requirementItemId?: string;
  @IsString() @MaxLength(120) supplierId: string;
  @IsOptional() @IsUUID() commercialAwardId?: string;
  @IsOptional() @IsUUID() purchaseOrderId?: string;
  @IsString() @MaxLength(1000) description: string;
  @IsNumber() @Min(0) amountExcludingTax: number;
  @IsOptional() @IsNumber() @Min(0) taxAmount?: number;
  @IsString() @MaxLength(8) currency: string;
}

export class ChangeCommitmentStatusDto {
  @IsEnum(FinanceCommitmentStatus) status: FinanceCommitmentStatus;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}

export class InvoiceLineDto {
  @IsOptional() @IsUUID() requirementItemId?: string;
  @IsString() @MaxLength(1000) description: string;
  @IsNumber() @Min(0.0001) quantity: number;
  @IsNumber() unitPrice: number;
  @IsOptional() @IsNumber() taxAmount?: number;
  @IsString() @MaxLength(80) sourceType: string;
  @IsString() @MaxLength(120) sourceId: string;
}

export class CreateClientInvoiceDto {
  @IsUUID() contactId: string;
  @IsString() @MaxLength(100) invoiceNumber: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsString() @MaxLength(8) currency: string;
  @IsOptional() @IsString() @MaxLength(180) contractReference?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}

export class ChangeInvoiceStatusDto {
  @IsEnum(FinanceInvoiceStatus) status: FinanceInvoiceStatus;
}

export class CreateFinancePaymentDto {
  @IsOptional() @IsUUID() invoiceId?: string;
  @IsOptional() @IsUUID() commitmentId?: string;
  @IsEnum(FinancePaymentDirection) direction: FinancePaymentDirection;
  @IsNumber() @Min(0.01) amount: number;
  @IsString() @MaxLength(8) currency: string;
  @IsOptional() @IsDateString() plannedDate?: string;
  @IsOptional() @IsString() @MaxLength(180) bankReference?: string;
}

export class ChangePaymentStatusDto {
  @IsEnum(FinancePaymentStatus) status: FinancePaymentStatus;
}

export class CreateReconciliationDto {
  @IsString() @MaxLength(120) reconciliationType: string;
  @IsString() @MaxLength(80) sourceModule: string;
  @IsString() @MaxLength(80) sourceType: string;
  @IsString() @MaxLength(120) sourceId: string;
  @IsNumber() expectedAmount: number;
  @IsNumber() recordedAmount: number;
  @IsOptional() @IsString() @MaxLength(3000) explanation?: string;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class ChangeReconciliationStatusDto {
  @IsEnum(FinanceReconciliationStatus) status: FinanceReconciliationStatus;
  @IsOptional() @IsString() @MaxLength(3000) explanation?: string;
}

export class CreateFinanceCloseItemDto {
  @IsString() @MaxLength(120) closeType: string;
  @IsString() @MaxLength(2000) criteria: string;
}

export class ChangeFinanceCloseStatusDto {
  @IsEnum(FinanceCloseStatus) status: FinanceCloseStatus;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}
