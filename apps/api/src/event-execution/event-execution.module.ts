import { Module } from '@nestjs/common';
import { EVENT_EXECUTION_PORT } from './event-execution.port';
import { EventExecutionService } from './event-execution.service';
import { EventExecutionController } from './event-execution.controller';

@Module({
  controllers: [EventExecutionController],
  providers: [
    EventExecutionService,
    {
      provide: EVENT_EXECUTION_PORT,
      useExisting: EventExecutionService,
    },
  ],
  exports: [EventExecutionService, EVENT_EXECUTION_PORT],
})
export class EventExecutionModule {}
