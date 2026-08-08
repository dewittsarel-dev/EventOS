import { Module } from '@nestjs/common';
import { ResourcesModule } from '../resources/resources.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [ResourcesModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
