import { ApiProperty } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty({ example: 'contact-1' })
  id: string;

  @ApiProperty({ example: 'org-1' })
  organizationId: string;

  @ApiProperty({ example: 'Lara' })
  firstName: string;

  @ApiProperty({ example: 'Croft', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'lara@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+27 82 000 0000', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '+27 82 111 2222', nullable: true })
  mobile: string | null;

  @ApiProperty({ example: 'Acme Corporation', nullable: true })
  companyName: string | null;

  @ApiProperty({ example: 'Client', nullable: true })
  contactType: string | null;

  @ApiProperty({ example: '123 Main Street, Cape Town', nullable: true })
  address: string | null;

  @ApiProperty({
    example: 'Prefers WhatsApp contact during business hours.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z', nullable: true })
  archivedAt: Date | null;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;
}

export class LinkedEventDto {
  @ApiProperty({ example: 'event-1' })
  id: string;

  @ApiProperty({ example: 'Corporate Gala' })
  title: string;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  eventDate: Date;

  @ApiProperty({ example: 'Planned' })
  status: string;
}

export class LinkedQuotationDto {
  @ApiProperty({ example: 'quotation-1' })
  id: string;

  @ApiProperty({ example: 'Q-0001' })
  quoteNumber: string;

  @ApiProperty({ example: 'Wedding Package' })
  title: string;

  @ApiProperty({ example: 'Draft' })
  status: string;

  @ApiProperty({ example: 250000 })
  totalCents: number;

  @ApiProperty({ example: 'event-1', nullable: true })
  eventId: string | null;
}

export class LinkedMeetingNoteDto {
  @ApiProperty({ example: 'meeting-note-1' })
  id: string;

  @ApiProperty({ example: 'Initial Briefing' })
  title: string;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  meetingDate: Date;

  @ApiProperty({ example: 'ClientMeeting' })
  meetingType: string;

  @ApiProperty({ example: 'event-1' })
  eventId: string;
}

export class LinkedTaskDto {
  @ApiProperty({ example: 'task-1' })
  id: string;

  @ApiProperty({ example: 'Confirm venue access' })
  title: string;

  @ApiProperty({ example: 'Todo' })
  status: string;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ example: 'event-1', nullable: true })
  eventId: string | null;

  @ApiProperty({ example: 'quotation-1', nullable: true })
  quotationId: string | null;
}

export class ContactDetailsResponseDto extends ContactResponseDto {
  @ApiProperty({ example: 'EventOS Demo Organization' })
  organizationName: string;

  @ApiProperty({ type: LinkedEventDto, isArray: true })
  events: LinkedEventDto[];

  @ApiProperty({ type: LinkedQuotationDto, isArray: true })
  quotations: LinkedQuotationDto[];

  @ApiProperty({ type: LinkedMeetingNoteDto, isArray: true })
  meetingNotes: LinkedMeetingNoteDto[];

  @ApiProperty({ type: LinkedTaskDto, isArray: true })
  tasks: LinkedTaskDto[];
}

export class ContactListResponseDto {
  @ApiProperty({ type: ContactResponseDto, isArray: true })
  data: ContactResponseDto[];
}
