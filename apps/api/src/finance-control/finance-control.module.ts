import { Module } from '@nestjs/common';
import { FinanceControlController } from './finance-control.controller';
import { FinanceControlService } from './finance-control.service';

@Module({
  controllers: [FinanceControlController],
  providers: [FinanceControlService],
  exports: [FinanceControlService],
})
export class FinanceControlModule {}
