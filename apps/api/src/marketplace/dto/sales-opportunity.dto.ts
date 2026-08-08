import { SalesOpportunityStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSalesOpportunityDto {
  @IsUUID() organizationId!: string;
}

export class UpdateSalesOpportunityDto {
  @IsUUID() organizationId!: string;
  @IsOptional() @IsEnum(SalesOpportunityStatus) status?: SalesOpportunityStatus;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(150) title?: string;
  @IsOptional() @IsString() @MaxLength(100) eventType?: string;
  @IsOptional() @IsDateString() eventDate?: string;
  @IsOptional() @IsString() @MaxLength(200) venue?: string;
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedValueCents?: number;
  @IsOptional() @IsString() @MaxLength(4000) qualificationNotes?: string;
}

export class ConvertSalesOpportunityDto {
  @IsUUID() organizationId!: string;
  @IsIn([
    'AcceptedQuotation',
    'DepositReceived',
    'SignedAgreement',
    'ManagerApproval',
    'Other',
  ])
  confirmationEvidenceType!: string;
  @IsString() @IsNotEmpty() @MaxLength(500) confirmationReference!: string;
  @IsString() @IsNotEmpty() @MaxLength(150) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) eventType!: string;
  @IsDateString() eventDate!: string;
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
  @IsString() @IsNotEmpty() @MaxLength(200) venue!: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(0) budgetCents?: number;
  @IsOptional() @IsUUID() assignedUserId?: string;
}
