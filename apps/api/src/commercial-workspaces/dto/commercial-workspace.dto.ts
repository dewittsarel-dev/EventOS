import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommercialMessageType } from '@prisma/client';
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
