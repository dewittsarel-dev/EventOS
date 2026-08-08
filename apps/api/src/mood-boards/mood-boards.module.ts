import { Module } from '@nestjs/common';
import { MoodBoardsController } from './mood-boards.controller';
import { MoodBoardsService } from './mood-boards.service';

@Module({
  controllers: [MoodBoardsController],
  providers: [MoodBoardsService],
})
export class MoodBoardsModule {}
