import { PartialType } from '@nestjs/swagger';
import { CreateMeetingNoteDto } from './create-meeting-note.dto';

export class UpdateMeetingNoteDto extends PartialType(CreateMeetingNoteDto) {}
