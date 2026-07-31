import { Module } from '@nestjs/common';
import { MeetingNotesController } from './meeting-notes.controller';
import { MeetingNotesService } from './meeting-notes.service';

@Module({
  controllers: [MeetingNotesController],
  providers: [MeetingNotesService],
})
export class MeetingNotesModule {}
