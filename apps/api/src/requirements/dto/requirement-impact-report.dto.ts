import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequirementImpactDecision } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CreateRequirementItemDto } from './create-requirement-set.dto';

export class CandidateRequirementItemDto extends CreateRequirementItemDto {
  @ApiPropertyOptional({
    example: 'R-001',
    description: 'Existing code; omit for a newly generated requirement',
  })
  @IsOptional()
  @IsString()
  @Matches(/^R-\d{3,}$/)
  requirementCode?: string;
}

export class CreateRequirementImpactReportDto {
  @ApiProperty({ type: [CandidateRequirementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateRequirementItemDto)
  proposedItems: CandidateRequirementItemDto[];
}

export class RequirementImpactDecisionDto {
  @ApiProperty()
  @IsUUID()
  changeId: string;

  @ApiProperty({
    enum: [
      RequirementImpactDecision.Apply,
      RequirementImpactDecision.KeepCurrent,
    ],
  })
  @IsIn([
    RequirementImpactDecision.Apply,
    RequirementImpactDecision.KeepCurrent,
  ])
  decision: RequirementImpactDecision;
}

export class ApplyRequirementImpactReportDto {
  @ApiProperty({ type: [RequirementImpactDecisionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementImpactDecisionDto)
  decisions: RequirementImpactDecisionDto[];
}
