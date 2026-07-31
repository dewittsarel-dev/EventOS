import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { EventStatus } from './event-status.enum';

export class CreateEventDto {
  @ApiProperty({
    example: 'org-1',
    description: 'Organization id that owns this event',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    example: 'contact-1',
    description: 'Owner contact id for this event',
  })
  @IsUUID()
  contactId: string;

  @ApiProperty({
    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    description: 'Optional assigned user id for ownership',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiProperty({
    example: 'Wedding Reception',
    description: 'Event title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    example: 'Wedding',
    description: 'Type/category of this event',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType: string;

  @ApiProperty({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Event calendar date (time ignored)',
  })
  @IsDateString()
  eventDate: string;

  @ApiProperty({
    example: '16:00',
    description: 'Start time in 24-hour HH:mm format',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @ApiProperty({
    example: '22:00',
    description: 'End time in 24-hour HH:mm format',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @ApiProperty({
    example: 'Cape Town Convention Center',
    description: 'Venue where the event takes place',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  venue: string;

  @ApiProperty({
    example: 250000,
    description: 'Optional budget in cents',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetCents?: number;

  @ApiProperty({
    example: 'Customer requested floral-themed setup.',
    description: 'Optional internal notes',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({
    example: EventStatus.Draft,
    description: 'Current event status',
    enum: EventStatus,
  })
  @IsEnum(EventStatus)
  status: EventStatus;
}
