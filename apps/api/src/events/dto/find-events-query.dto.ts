import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EventStatus } from './event-status.enum';

export enum EventSortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export class FindEventsQueryDto {
  @ApiPropertyOptional({
    example: 'org-1',
    description: 'Organization id to list events for',
  })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Page size for pagination',
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'wedding',
    description: 'Case-insensitive search term for event name, type or venue',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({
    example: 'Wedding',
    description: 'Filter by event type',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventType?: string;

  @ApiPropertyOptional({
    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    description: 'Filter by assigned user',
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({
    example: EventStatus.Planned,
    enum: EventStatus,
    description: 'Filter by event status',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    example: EventSortOrder.Desc,
    enum: EventSortOrder,
    description: 'Sort by start date order',
  })
  @IsOptional()
  @IsEnum(EventSortOrder)
  sort?: EventSortOrder;
}
