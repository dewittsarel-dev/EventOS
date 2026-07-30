import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
    example: 'Wedding Reception',
    description: 'Event title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    example: 'Sunset ceremony and reception',
    description: 'Optional event description',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: '2026-09-01T16:00:00.000Z',
    description: 'Scheduled event start date and time',
  })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({
    example: '2026-09-01T22:00:00.000Z',
    description: 'Scheduled event end date and time',
  })
  @IsDateString()
  endDateTime: string;

  @ApiProperty({
    example: 'Cape Town Convention Center',
    description: 'Optional event location',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({
    example: EventStatus.Draft,
    description: 'Current event status',
    enum: EventStatus,
  })
  @IsEnum(EventStatus)
  status: EventStatus;
}
