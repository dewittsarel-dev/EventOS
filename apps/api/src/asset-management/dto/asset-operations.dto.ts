import {
  AssetDisposalStatus,
  AssetIncidentType,
  AssetInspectionOutcome,
  AssetMaintenanceStatus,
  AssetMovementType,
  AssetOperationStatus,
  AssetReservationStatus,
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

export class CreateAssetLocationDto {
  @IsUUID() organizationId: string;
  @IsOptional() @IsUUID() storageLocationId?: string;
  @IsOptional() @IsUUID() parentLocationId?: string;
  @IsString() @MaxLength(80) code: string;
  @IsString() @MaxLength(180) name: string;
  @IsString() @MaxLength(80) locationType: string;
  @IsOptional() @IsString() @MaxLength(180) qrIdentity?: string;
  @IsOptional() @IsNumber() @Min(0) capacity?: number;
  @IsOptional() @IsString() @MaxLength(40) capacityUnit?: string;
  @IsOptional() @IsObject() handlingRules?: Record<string, unknown>;
}

export class RecordAssetMovementDto {
  @IsUUID() organizationId: string;
  @IsString() @MaxLength(40) assetEntityType: string;
  @IsString() @MaxLength(120) assetEntityId: string;
  @IsEnum(AssetMovementType) movementType: AssetMovementType;
  @IsOptional() @IsNumber() @Min(0.0001) quantity?: number;
  @IsOptional() @IsUUID() fromLocationId?: string;
  @IsOptional() @IsUUID() toLocationId?: string;
  @IsOptional() @IsString() @MaxLength(60) toCustodianType?: string;
  @IsOptional() @IsString() @MaxLength(120) toCustodianId?: string;
  @IsOptional() @IsUUID() eventId?: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class RecordAssetQrEventDto {
  @IsUUID() organizationId: string;
  @IsString() @MaxLength(180) qrIdentity: string;
  @IsString() @MaxLength(80) action: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsUUID() eventId?: string;
  @IsOptional() @IsString() @MaxLength(180) deviceId?: string;
  @IsOptional() @IsDateString() offlineRecordedAt?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class CreateAssetReservationDto {
  @IsUUID() organizationId: string;
  @IsUUID() eventId: string;
  @IsUUID() requirementItemId: string;
  @IsUUID() assetDefinitionId: string;
  @IsOptional() @IsUUID() assetInstanceId?: string;
  @IsNumber() @Min(0.0001) quantity: number;
  @IsDateString() startDateTime: string;
  @IsDateString() endDateTime: string;
  @IsOptional() @IsNumber() priority?: number;
}

export class ChangeAssetReservationStatusDto {
  @IsEnum(AssetReservationStatus) status: AssetReservationStatus;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}

export class AssetOperationLineDto {
  @IsOptional() @IsUUID() requirementItemId?: string;
  @IsString() @MaxLength(40) assetEntityType: string;
  @IsString() @MaxLength(120) assetEntityId: string;
  @IsNumber() @Min(0.0001) quantityPlanned: number;
}

export class CreateAssetOperationDto {
  @IsUUID() organizationId: string;
  @IsOptional() @IsUUID() eventId?: string;
  @IsString() @MaxLength(80) operationType: string;
  @IsOptional() @IsUUID() sourceLocationId?: string;
  @IsOptional() @IsUUID() targetLocationId?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssetOperationLineDto)
  lines: AssetOperationLineDto[];
}

export class ChangeAssetOperationStatusDto {
  @IsEnum(AssetOperationStatus) status: AssetOperationStatus;
  @IsOptional() @IsString() @MaxLength(2000) exceptionNotes?: string;
}

export class RecordAssetInspectionDto {
  @IsUUID() organizationId: string;
  @IsString() @MaxLength(40) assetEntityType: string;
  @IsString() @MaxLength(120) assetEntityId: string;
  @IsString() @MaxLength(80) inspectionType: string;
  @IsEnum(AssetInspectionOutcome) outcome: AssetInspectionOutcome;
  @IsOptional() @IsString() @MaxLength(80) conditionGrade?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsObject() responses?: Record<string, unknown>;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
  @IsOptional() @IsUUID() eventId?: string;
}

export class RecordAssetDeploymentDto {
  @IsUUID() organizationId: string;
  @IsUUID() eventId: string;
  @IsOptional() @IsUUID() requirementItemId?: string;
  @IsString() @MaxLength(40) assetEntityType: string;
  @IsString() @MaxLength(120) assetEntityId: string;
  @IsOptional() @IsNumber() @Min(0.0001) quantity?: number;
  @IsOptional() @IsString() @MaxLength(180) deploymentArea?: string;
  @IsString() @MaxLength(80) setupStatus: string;
  @IsOptional() @IsString() @MaxLength(80) conditionAtDeploy?: string;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}

export class CreateAssetMaintenanceDto {
  @IsUUID() organizationId: string;
  @IsString() @MaxLength(40) assetEntityType: string;
  @IsString() @MaxLength(120) assetEntityId: string;
  @IsString() @MaxLength(80) maintenanceType: string;
  @IsString() @MaxLength(40) priority: string;
  @IsString() @MaxLength(4000) description: string;
  @IsOptional() @IsDateString() scheduledStart?: string;
  @IsOptional() @IsDateString() scheduledEnd?: string;
  @IsOptional() @IsNumber() @Min(0) estimatedCost?: number;
}

export class ChangeAssetMaintenanceStatusDto {
  @IsEnum(AssetMaintenanceStatus) status: AssetMaintenanceStatus;
  @IsOptional() @IsString() @MaxLength(4000) completionNotes?: string;
  @IsOptional() @IsNumber() @Min(0) actualCost?: number;
}

export class CreateAssetIncidentDto {
  @IsUUID() organizationId: string;
  @IsOptional() @IsUUID() eventId?: string;
  @IsString() @MaxLength(40) assetEntityType: string;
  @IsString() @MaxLength(120) assetEntityId: string;
  @IsEnum(AssetIncidentType) incidentType: AssetIncidentType;
  @IsOptional() @IsNumber() @Min(0.0001) quantity?: number;
  @IsDateString() occurredAt: string;
  @IsString() @MaxLength(4000) description: string;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
  @IsOptional() @IsNumber() @Min(0) estimatedLoss?: number;
}

export class CreateAssetDisposalDto {
  @IsUUID() organizationId: string;
  @IsString() @MaxLength(40) assetEntityType: string;
  @IsString() @MaxLength(120) assetEntityId: string;
  @IsString() @MaxLength(80) disposalMethod: string;
  @IsString() @MaxLength(2000) reason: string;
  @IsOptional() @IsNumber() @Min(0) proposedValue?: number;
}

export class ChangeAssetDisposalStatusDto {
  @IsEnum(AssetDisposalStatus) status: AssetDisposalStatus;
  @IsOptional() @IsNumber() @Min(0) realisedValue?: number;
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}
