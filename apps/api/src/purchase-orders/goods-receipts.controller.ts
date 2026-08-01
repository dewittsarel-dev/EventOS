import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { FindGoodsReceiptsQueryDto } from './dto/find-goods-receipts-query.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('goods-receipts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateGoodsReceiptDto,
  ) {
    return this.purchaseOrdersService.createGoodsReceipt(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindGoodsReceiptsQueryDto,
  ) {
    return this.purchaseOrdersService.listGoodsReceipts(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrdersService.findGoodsReceipt(user.id, id);
  }
}
