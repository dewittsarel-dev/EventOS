import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EventStatus } from './event-status.enum';

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: 'contact-1',
    description: 'Owner contact id for this event',
  })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({
    example: 'Wedding Reception',
    description: 'Event title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example: 'Sunset ceremony and reception',
    description: 'Optional event description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({
    example: '2026-09-01T16:00:00.000Z',
    description: 'Scheduled event start date and time',
  })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({
    example: '2026-09-01T22:00:00.000Z',
    description: 'Scheduled event end date and time',
  })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiPropertyOptional({
    example: 'Cape Town Convention Center',
    description: 'Optional event location',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @ApiPropertyOptional({
    example: EventStatus.Planned,
    enum: EventStatus,
    description: 'Current event status',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
