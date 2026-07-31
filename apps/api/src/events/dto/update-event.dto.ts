import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { EventStatus } from './event-status.enum';

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: 'contact-1',
    description: 'Client contact id for this event',
  })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({
    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    description: 'Assigned user id for this event',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string | null;

  @ApiPropertyOptional({
    example: 'Wedding Reception',
    description: 'Event title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example: 'Wedding',
    description: 'Type/category of this event',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventType?: string;

  @ApiPropertyOptional({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Event calendar date (time ignored)',
  })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({
    example: '16:00',
    description: 'Start time in 24-hour HH:mm format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @ApiPropertyOptional({
    example: '22:00',
    description: 'End time in 24-hour HH:mm format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;

  @ApiPropertyOptional({
    example: 'Cape Town Convention Center',
    description: 'Venue where the event takes place',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  venue?: string;

  @ApiPropertyOptional({
    example: 250000,
    description: 'Budget in cents',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetCents?: number | null;

  @ApiPropertyOptional({
    example: 'Customer requested floral-themed setup.',
    description: 'Internal notes',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({
    example: EventStatus.Planned,
    enum: EventStatus,
    description: 'Current event status',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
