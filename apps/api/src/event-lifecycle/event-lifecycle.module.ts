import { Module } from '@nestjs/common';
import { EventExecutionModule } from '../event-execution/event-execution.module';
import { FinanceControlModule } from '../finance-control/finance-control.module';
import { EventLifecycleController } from './event-lifecycle.controller';
import { EventLifecycleService } from './event-lifecycle.service';

@Module({
  imports: [EventExecutionModule, FinanceControlModule],
  controllers: [EventLifecycleController],
  providers: [EventLifecycleService],
})
export class EventLifecycleModule {}
