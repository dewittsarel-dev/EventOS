import {
  ExecutionControlStatus,
  ExecutionGateDecision,
  ExecutionIncidentSeverity,
  ExecutionIncidentStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateExecutionDto {
  @IsOptional() @IsString() @MaxLength(4000) summary?: string;
}

export class BuildExecutionPlanDto {
  @IsOptional() @IsObject() planningContext?: Record<string, unknown>;
}

export class CreateExecutionTaskDto {
  @IsOptional() @IsUUID() workstreamId?: string;
  @IsOptional() @IsUUID() requirementItemId?: string;
  @IsString() @MaxLength(300) title: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsString() @MaxLength(4000) completionCriteria: string;
  @IsOptional() @IsUUID() assignedUserId?: string;
  @IsOptional() @IsString() @MaxLength(120) assignedSupplierId?: string;
  @IsOptional() @IsDateString() plannedStart?: string;
  @IsOptional() @IsDateString() plannedEnd?: string;
}

export class ChangeExecutionTaskStatusDto {
  @IsEnum(ExecutionControlStatus) status: ExecutionControlStatus;
  @IsOptional() @IsObject() completionEvidence?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(2000) blockedReason?: string;
}

export class AssessExecutionGateDto {
  @IsString() @MaxLength(100) key: string;
  @IsString() @MaxLength(240) name: string;
  @IsString() @MaxLength(120) category: string;
  @IsEnum(ExecutionGateDecision) decision: ExecutionGateDecision;
  @IsOptional() @IsObject() criteria?: Record<string, unknown>;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(2000) blockerSummary?: string;
  @IsOptional() @IsString() @MaxLength(2000) waiverReason?: string;
}

export class CreateSiteControlDto {
  @IsString() @MaxLength(120) controlType: string;
  @IsOptional() @IsString() @MaxLength(180) area?: string;
  @IsOptional() @IsString() @MaxLength(60) partyType?: string;
  @IsOptional() @IsString() @MaxLength(120) partyId?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsString() @MaxLength(180) permitReference?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class RecordCommissioningCheckDto {
  @IsString() @MaxLength(120) systemType: string;
  @IsOptional() @IsString() @MaxLength(180) systemReference?: string;
  @IsString() @MaxLength(240) testName: string;
  @IsString() @MaxLength(2000) criteria: string;
  @IsEnum(ExecutionControlStatus) status: ExecutionControlStatus;
  @IsOptional() @IsString() @MaxLength(2000) result?: string;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class RecordExecutionAcceptanceDto {
  @IsString() @MaxLength(120) acceptanceType: string;
  @IsString() @MaxLength(60) acceptedPartyType: string;
  @IsOptional() @IsString() @MaxLength(120) acceptedPartyId?: string;
  @IsEnum(ExecutionGateDecision) decision: ExecutionGateDecision;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class RunOfShowItemDto {
  @IsInt() @Min(0) sequence: number;
  @IsString() @MaxLength(300) title: string;
  @IsDateString() scheduledAt: string;
  @IsOptional() @IsInt() @Min(0) durationMinutes?: number;
  @IsOptional() @IsUUID() ownerUserId?: string;
  @IsOptional() @IsString() @MaxLength(120) supplierId?: string;
  @IsOptional() @IsString() @MaxLength(80) cueType?: string;
}

export class SetRunOfShowDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RunOfShowItemDto)
  items: RunOfShowItemDto[];
}

export class RecordCommandLogDto {
  @IsString() @MaxLength(100) logType: string;
  @IsString() @MaxLength(40) severity: string;
  @IsString() @MaxLength(4000) message: string;
  @IsOptional() @IsString() @MaxLength(80) relatedType?: string;
  @IsOptional() @IsString() @MaxLength(120) relatedId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsDateString() occurredAt?: string;
}

export class CreateExecutionIncidentDto {
  @IsString() @MaxLength(120) incidentType: string;
  @IsEnum(ExecutionIncidentSeverity) severity: ExecutionIncidentSeverity;
  @IsString() @MaxLength(300) title: string;
  @IsString() @MaxLength(6000) description: string;
  @IsOptional() @IsString() @MaxLength(300) location?: string;
  @IsOptional() @IsInt() @Min(0) peopleAtRisk?: number;
  @IsOptional() @IsObject() immediateActions?: Record<string, unknown>;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class ChangeExecutionIncidentStatusDto {
  @IsEnum(ExecutionIncidentStatus) status: ExecutionIncidentStatus;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class CreateCloseoutItemDto {
  @IsString() @MaxLength(120) closeoutType: string;
  @IsOptional() @IsString() @MaxLength(80) referenceType?: string;
  @IsOptional() @IsString() @MaxLength(120) referenceId?: string;
  @IsString() @MaxLength(2000) criteria: string;
}

export class CompleteCloseoutItemDto {
  @IsEnum(ExecutionControlStatus) status: ExecutionControlStatus;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}
