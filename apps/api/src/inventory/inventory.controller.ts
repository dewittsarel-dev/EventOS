import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateOpeningBalanceDto } from './dto/create-opening-balance.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { FindInventoryCategoriesQueryDto } from './dto/find-inventory-categories-query.dto';
import { FindInventoryItemsQueryDto } from './dto/find-inventory-items-query.dto';
import { FindStockLevelsQueryDto } from './dto/find-stock-levels-query.dto';
import { FindStockMovementsQueryDto } from './dto/find-stock-movements-query.dto';
import { FindStorageLocationsQueryDto } from './dto/find-storage-locations-query.dto';
import {
  InventoryCategoryListResponseDto,
  InventoryCategoryResponseDto,
  InventoryItemListResponseDto,
  InventoryItemResponseDto,
  InventoryOverviewResponseDto,
  StockLevelListResponseDto,
  StockMovementListResponseDto,
  StockMovementResponseDto,
  StorageLocationListResponseDto,
  StorageLocationResponseDto,
} from './dto/inventory-response.dto';
import { InventoryService } from './inventory.service';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';

@ApiTags('inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('overview')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Get inventory overview for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiOkResponse({ type: InventoryOverviewResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  getOverview(
    @CurrentUser() user: UserResponseDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.inventoryService.getOverview(user.id, organizationId);
  }

  @Post('categories')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create inventory category' })
  @ApiCreatedResponse({ type: InventoryCategoryResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  createCategory(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateInventoryCategoryDto,
  ) {
    return this.inventoryService.createCategory(user.id, dto);
  }

  @Get('categories')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List inventory categories' })
  @ApiOkResponse({ type: InventoryCategoryListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  findCategories(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindInventoryCategoriesQueryDto,
  ) {
    return this.inventoryService.findCategories(user.id, query);
  }

  @Patch('categories/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update inventory category' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: InventoryCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Inventory category not found' })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  updateCategory(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryCategoryDto,
  ) {
    return this.inventoryService.updateCategory(user.id, id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete inventory category' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Category deleted' })
  @ApiNotFoundResponse({ description: 'Inventory category not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  async removeCategory(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    await this.inventoryService.removeCategory(user.id, id);
  }

  @Post('locations')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create storage location' })
  @ApiCreatedResponse({ type: StorageLocationResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  createLocation(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateStorageLocationDto,
  ) {
    return this.inventoryService.createLocation(user.id, dto);
  }

  @Get('locations')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List storage locations' })
  @ApiOkResponse({ type: StorageLocationListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  findLocations(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindStorageLocationsQueryDto,
  ) {
    return this.inventoryService.findLocations(user.id, query);
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Get storage location by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: StorageLocationResponseDto })
  @ApiNotFoundResponse({ description: 'Storage location not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  findLocation(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.inventoryService.findLocation(user.id, id);
  }

  @Patch('locations/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update storage location' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: StorageLocationResponseDto })
  @ApiNotFoundResponse({ description: 'Storage location not found' })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  updateLocation(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateStorageLocationDto,
  ) {
    return this.inventoryService.updateLocation(user.id, id, dto);
  }

  @Delete('locations/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete storage location' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Storage location deleted' })
  @ApiNotFoundResponse({ description: 'Storage location not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  async removeLocation(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    await this.inventoryService.removeLocation(user.id, id);
  }

  @Post('items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create inventory item' })
  @ApiCreatedResponse({ type: InventoryItemResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  createItem(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(user.id, dto);
  }

  @Get('items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List inventory items' })
  @ApiOkResponse({ type: InventoryItemListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  findItems(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindInventoryItemsQueryDto,
  ) {
    return this.inventoryService.findItems(user.id, query);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get inventory item by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: InventoryItemResponseDto })
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  findItem(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.inventoryService.findItem(user.id, id);
  }

  @Patch('items/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: InventoryItemResponseDto })
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  updateItem(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Inventory item deleted' })
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  async removeItem(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    await this.inventoryService.removeItem(user.id, id);
  }

  @Get('stock-levels')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List stock levels by item and location' })
  @ApiOkResponse({ type: StockLevelListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  findStockLevels(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindStockLevelsQueryDto,
  ) {
    return this.inventoryService.findStockLevels(user.id, query);
  }

  @Get('movements')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List stock movement history' })
  @ApiOkResponse({ type: StockMovementListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  findStockMovements(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindStockMovementsQueryDto,
  ) {
    return this.inventoryService.findStockMovements(user.id, query);
  }

  @Post('opening-balance')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create opening balance stock movement' })
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  createOpeningBalance(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateOpeningBalanceDto,
  ) {
    return this.inventoryService.createOpeningBalance(user.id, dto);
  }

  @Post('adjustments')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create manual stock adjustment' })
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  createStockAdjustment(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    return this.inventoryService.createStockAdjustment(user.id, dto);
  }

  @Post('transfers')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Transfer stock between locations' })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        transferOut: { $ref: '#/components/schemas/StockMovementResponseDto' },
        transferIn: { $ref: '#/components/schemas/StockMovementResponseDto' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or permission',
  })
  createStockTransfer(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateStockTransferDto,
  ) {
    return this.inventoryService.createStockTransfer(user.id, dto);
  }
}
