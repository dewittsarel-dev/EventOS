import { Module } from '@nestjs/common';
import { EventDesignController } from './event-design.controller';
import { EventDesignService } from './event-design.service';

@Module({
  controllers: [EventDesignController],
  providers: [EventDesignService],
})
export class EventDesignModule {}
