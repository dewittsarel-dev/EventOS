import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AssignFinanceOwnerDto,
  ChangeBudgetStatusDto,
  ChangeCommitmentStatusDto,
  ChangeFinanceCloseStatusDto,
  ChangeInvoiceStatusDto,
  ChangePaymentStatusDto,
  ChangeReconciliationStatusDto,
  CreateBudgetVersionDto,
  CreateClientInvoiceDto,
  CreateCommitmentDto,
  CreateFinanceCloseItemDto,
  CreateFinancePaymentDto,
  CreateFinanceWbsDto,
  CreateFinanceWorkspaceDto,
  CreateFinancialChangeDto,
  CreateReconciliationDto,
  FinancialLineDto,
} from './dto/finance-control.dto';
import { FinanceControlService } from './finance-control.service';

@ApiTags('finance-control')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('organizations/:organizationId/events/:eventId/finance')
export class FinanceControlController {
  constructor(private readonly service: FinanceControlService) {}
  private ids(user: UserResponseDto, organizationId: string, eventId: string) {
    return [user.id, organizationId, eventId] as const;
  }

  @Post() create(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateFinanceWorkspaceDto,
  ) {
    return this.service.createWorkspace(...this.ids(u, o, e), d);
  }
  @Get() get(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
  ) {
    return this.service.getWorkspace(...this.ids(u, o, e));
  }
  @Get('summary') summary(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
  ) {
    return this.service.summary(...this.ids(u, o, e));
  }
  @Post('owners') owner(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: AssignFinanceOwnerDto,
  ) {
    return this.service.assignOwner(...this.ids(u, o, e), d);
  }
  @Post('wbs') wbs(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateFinanceWbsDto,
  ) {
    return this.service.createWbsNode(...this.ids(u, o, e), d);
  }
  @Post('lines') line(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: FinancialLineDto,
  ) {
    return this.service.createFinancialLine(...this.ids(u, o, e), d);
  }
  @Post('lines/:id/approve') approveLine(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
  ) {
    return this.service.approveFinancialLine(...this.ids(u, o, e), id);
  }
  @Post('budgets') budget(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateBudgetVersionDto,
  ) {
    return this.service.createBudgetVersion(...this.ids(u, o, e), d);
  }
  @Patch('budgets/:id/status') budgetStatus(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
    @Body() d: ChangeBudgetStatusDto,
  ) {
    return this.service.changeBudgetStatus(...this.ids(u, o, e), id, d);
  }
  @Post('changes') change(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateFinancialChangeDto,
  ) {
    return this.service.createChange(...this.ids(u, o, e), d);
  }
  @Post('changes/:id/approve') approveChange(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
  ) {
    return this.service.approveChange(...this.ids(u, o, e), id);
  }
  @Post('commitments') commitment(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateCommitmentDto,
  ) {
    return this.service.createCommitment(...this.ids(u, o, e), d);
  }
  @Patch('commitments/:id/status') commitmentStatus(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
    @Body() d: ChangeCommitmentStatusDto,
  ) {
    return this.service.changeCommitmentStatus(...this.ids(u, o, e), id, d);
  }
  @Post('invoices') invoice(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateClientInvoiceDto,
  ) {
    return this.service.createInvoice(...this.ids(u, o, e), d);
  }
  @Patch('invoices/:id/status') invoiceStatus(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
    @Body() d: ChangeInvoiceStatusDto,
  ) {
    return this.service.changeInvoiceStatus(...this.ids(u, o, e), id, d);
  }
  @Post('payments') payment(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateFinancePaymentDto,
  ) {
    return this.service.createPayment(...this.ids(u, o, e), d);
  }
  @Patch('payments/:id/status') paymentStatus(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
    @Body() d: ChangePaymentStatusDto,
  ) {
    return this.service.changePaymentStatus(...this.ids(u, o, e), id, d);
  }
  @Post('reconciliations') reconciliation(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateReconciliationDto,
  ) {
    return this.service.createReconciliation(...this.ids(u, o, e), d);
  }
  @Patch('reconciliations/:id/status') reconciliationStatus(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
    @Body() d: ChangeReconciliationStatusDto,
  ) {
    return this.service.changeReconciliationStatus(...this.ids(u, o, e), id, d);
  }
  @Post('close-items') closeItem(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Body() d: CreateFinanceCloseItemDto,
  ) {
    return this.service.createCloseItem(...this.ids(u, o, e), d);
  }
  @Patch('close-items/:id') closeItemStatus(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
    @Param('id') id: string,
    @Body() d: ChangeFinanceCloseStatusDto,
  ) {
    return this.service.changeCloseItem(...this.ids(u, o, e), id, d);
  }
  @Post('close') close(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
  ) {
    return this.service.closeWorkspace(...this.ids(u, o, e));
  }
}
