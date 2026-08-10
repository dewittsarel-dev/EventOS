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
  ApiConflictResponse,
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
import { CreateSupplierProductDto } from './dto/create-supplier-product.dto';
import { FindSupplierProductsQueryDto } from './dto/find-supplier-products-query.dto';
import { SupplierProductCategory } from './dto/supplier-product-category.enum';
import {
  SupplierProductListResponseDto,
  SupplierProductResponseDto,
} from './dto/supplier-product-response.dto';
import { SupplierProductSortBy } from './dto/supplier-product-sort.enum';
import { UpdateSupplierProductDto } from './dto/update-supplier-product.dto';
import { SupplierProductsService } from './supplier-products.service';

@ApiTags('supplier-products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('suppliers/:supplierId/products')
export class SupplierProductsController {
  constructor(
    private readonly supplierProductsService: SupplierProductsService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a supplier product' })
  @ApiParam({ name: 'supplierId' })
  @ApiCreatedResponse({ type: SupplierProductResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or supplier',
  })
  @ApiConflictResponse({
    description: 'SKU already exists in this organization',
  })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateSupplierProductDto,
  ) {
    return this.supplierProductsService.create(user.id, supplierId, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List supplier products' })
  @ApiParam({ name: 'supplierId' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'category',
    enum: SupplierProductCategory,
    required: false,
  })
  @ApiQuery({ name: 'active', required: false })
  @ApiQuery({ name: 'sortBy', enum: SupplierProductSortBy, required: false })
  @ApiOkResponse({ type: SupplierProductListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or supplier',
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Query() query: FindSupplierProductsQueryDto,
  ) {
    return this.supplierProductsService.findAll(user.id, supplierId, query);
  }

  @Get(':productId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Get supplier product by id' })
  @ApiParam({ name: 'supplierId' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiOkResponse({ type: SupplierProductResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or supplier',
  })
  @ApiNotFoundResponse({ description: 'Supplier product not found' })
  findOne(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.supplierProductsService.findOne(
      user.id,
      supplierId,
      productId,
      organizationId,
    );
  }

  @Patch(':productId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update supplier product by id' })
  @ApiParam({ name: 'supplierId' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiOkResponse({ type: SupplierProductResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or supplier',
  })
  @ApiNotFoundResponse({ description: 'Supplier product not found' })
  @ApiConflictResponse({
    description: 'SKU already exists in this organization',
  })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: UpdateSupplierProductDto,
  ) {
    return this.supplierProductsService.update(
      user.id,
      supplierId,
      productId,
      organizationId,
      dto,
    );
  }

  @Patch(':productId/submit-review')
  @ApiOperation({ summary: 'Submit supplier product for Marketplace review' })
  submitForReview(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.supplierProductsService.submitForReview(
      user.id,
      supplierId,
      productId,
      organizationId,
    );
  }

  @Patch(':productId/publish')
  @ApiOperation({ summary: 'Publish supplier product to Marketplace' })
  publish(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.supplierProductsService.publish(
      user.id,
      supplierId,
      productId,
      organizationId,
    );
  }

  @Patch(':productId/withdraw')
  @ApiOperation({ summary: 'Withdraw supplier product from Marketplace' })
  withdraw(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.supplierProductsService.withdraw(
      user.id,
      supplierId,
      productId,
      organizationId,
    );
  }

  @Patch(':productId/archive')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Archive supplier product' })
  @ApiParam({ name: 'supplierId' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiOkResponse({ type: SupplierProductResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or supplier',
  })
  @ApiNotFoundResponse({ description: 'Supplier product not found' })
  archive(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.supplierProductsService.archive(
      user.id,
      supplierId,
      productId,
      organizationId,
    );
  }

  @Patch(':productId/restore')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Restore supplier product' })
  @ApiParam({ name: 'supplierId' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiOkResponse({ type: SupplierProductResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or supplier',
  })
  @ApiNotFoundResponse({ description: 'Supplier product not found' })
  restore(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.supplierProductsService.restore(
      user.id,
      supplierId,
      productId,
      organizationId,
    );
  }

  @Delete(':productId')
  @HttpCode(204)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Delete supplier product by id (admin only)' })
  @ApiParam({ name: 'supplierId' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiNoContentResponse({
    description: 'Supplier product deleted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'Only admins can delete supplier products',
  })
  @ApiNotFoundResponse({ description: 'Supplier product not found' })
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('productId') productId: string,
    @Query('organizationId') organizationId: string,
  ) {
    await this.supplierProductsService.remove(
      user.id,
      supplierId,
      productId,
      organizationId,
    );
  }
}
