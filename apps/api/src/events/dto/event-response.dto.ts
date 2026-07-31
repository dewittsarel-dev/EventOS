import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from './event-status.enum';

export class EventResponseDto {
  @ApiProperty({ example: 'event-1' })
  id: string;

  @ApiProperty({ example: 'org-1' })
  organizationId: string;

  @ApiProperty({ example: 'contact-1' })
  contactId: string;

  @ApiProperty({ example: 'Lara Croft', nullable: true })
  contactName: string | null;

  @ApiProperty({
    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nullable: true,
  })
  assignedUserId: string | null;

  @ApiProperty({ example: 'Alice Admin', nullable: true })
  assignedUserName: string | null;

  @ApiProperty({ example: 'Wedding Reception' })
  title: string;

  @ApiProperty({ example: 'Wedding' })
  eventType: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  eventDate: Date;

  @ApiProperty({ example: '16:00' })
  startTime: string;

  @ApiProperty({ example: '22:00' })
  endTime: string;

  @ApiProperty({ example: 'Cape Town Convention Center', nullable: true })
  venue: string | null;

  @ApiProperty({ example: 250000, nullable: true })
  budgetCents: number | null;

  @ApiProperty({
    example: 'Customer requested floral-themed setup.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({ example: 'Sunset ceremony and reception', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-09-01T16:00:00.000Z' })
  startDateTime: Date;

  @ApiProperty({ example: '2026-09-01T22:00:00.000Z' })
  endDateTime: Date;

  @ApiProperty({ example: 'Cape Town Convention Center', nullable: true })
  location: string | null;

  @ApiProperty({ example: EventStatus.Draft, enum: EventStatus })
  status: EventStatus;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;
}

export class EventListResponseDto {
  @ApiProperty({ type: EventResponseDto, isArray: true })
  data: EventResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 42,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
