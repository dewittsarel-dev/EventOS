import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CommercialMessageType,
  CommercialSubstitutionReviewStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsBoolean,
  ValidateNested,
} from 'class-validator';

export class GenerateCommercialWorkspaceDto {
  @ApiProperty()
  @IsDateString()
  submissionDeadline: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  specialNotes?: string;
}

export class CommercialQuoteLineDto {
  @IsUUID()
  requirementItemId: string;

  @IsString()
  @MaxLength(500)
  offeredDescription: string;

  @IsNumber()
  @Min(0)
  quantityOffered: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsBoolean()
  included?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  qualificationNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  availabilityNotes?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsBoolean()
  isSubstitution?: boolean;
}

export class SubmitCommercialQuoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentTerms?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CommercialQuoteLineDto)
  lines: CommercialQuoteLineDto[];
}

export class CommercialAwardLineDto {
  @IsUUID()
  quoteLineId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

export class CreateCommercialAwardsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CommercialAwardLineDto)
  lines: CommercialAwardLineDto[];
}

export class ReviewCommercialSubstitutionDto {
  @IsIn([
    CommercialSubstitutionReviewStatus.Approved,
    CommercialSubstitutionReviewStatus.Rejected,
  ])
  status: CommercialSubstitutionReviewStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ApproveCommercialPoDraftDto {
  @IsString()
  @MaxLength(500)
  confirmation: string;
}

export class CommercialRfqLineDto {
  @ApiProperty()
  @IsUUID()
  requirementItemId: string;

  @ApiProperty({ minimum: 0.0001 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReviseCommercialRfqDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  specialNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  submissionDeadline?: string;

  @ApiProperty({ type: [CommercialRfqLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CommercialRfqLineDto)
  lines: CommercialRfqLineDto[];
}

export class CreateCommercialMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierId?: string;

  @ApiProperty({
    enum: [
      CommercialMessageType.PlannerReply,
      CommercialMessageType.Clarification,
      CommercialMessageType.Negotiation,
      CommercialMessageType.AiComment,
    ],
  })
  @IsIn([
    CommercialMessageType.PlannerReply,
    CommercialMessageType.Clarification,
    CommercialMessageType.Negotiation,
    CommercialMessageType.AiComment,
  ])
  type: CommercialMessageType;

  @ApiProperty()
  @IsString()
  @MaxLength(10000)
  body: string;
}
