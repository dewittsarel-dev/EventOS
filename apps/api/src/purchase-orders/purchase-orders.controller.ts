import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { FindPurchaseOrdersQueryDto } from './dto/find-purchase-orders-query.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('purchase-orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.create(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindPurchaseOrdersQueryDto,
  ) {
    return this.purchaseOrdersService.findAll(user.id, query);
  }

  @Get('suppliers/:supplierId/history')
  getSupplierHistory(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.purchaseOrdersService.getSupplierHistory(
      user.id,
      organizationId,
      supplierId,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrdersService.findOne(user.id, id);
  }

  @Get(':id/outstanding')
  getOutstanding(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    return this.purchaseOrdersService.getOutstanding(user.id, id);
  }

  @Get(':id/receipts')
  listReceipts(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrdersService.listPurchaseOrderReceipts(user.id, id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.updateDraft(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.purchaseOrdersService.deleteDraft(user.id, id);
  }

  @Patch(':id/submit-approval')
  submitForApproval(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    return this.purchaseOrdersService.submitForApproval(user.id, id);
  }

  @Patch(':id/approve')
  approve(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrdersService.approve(user.id, id);
  }

  @Patch(':id/return-draft')
  returnToDraft(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrdersService.returnToDraft(user.id, id);
  }

  @Patch(':id/mark-sent')
  markSent(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrdersService.markSent(user.id, id);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrdersService.cancel(user.id, id);
  }
}
