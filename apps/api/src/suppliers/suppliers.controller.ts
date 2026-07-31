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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FindSuppliersQueryDto } from './dto/find-suppliers-query.dto';
import { SupplierCategory } from './dto/supplier-category.enum';
import {
  SupplierListResponseDto,
  SupplierResponseDto,
} from './dto/supplier-response.dto';
import { SupplierSortBy } from './dto/supplier-sort.enum';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a supplier' })
  @ApiCreatedResponse({
    description: 'Supplier created successfully',
    type: SupplierResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  create(@CurrentUser() user: UserResponseDto, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List suppliers for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', enum: SupplierCategory, required: false })
  @ApiQuery({ name: 'preferredSupplier', required: false })
  @ApiQuery({ name: 'active', required: false })
  @ApiQuery({ name: 'sortBy', enum: SupplierSortBy, required: false })
  @ApiOkResponse({
    description: 'Suppliers retrieved successfully',
    type: SupplierListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindSuppliersQueryDto,
  ) {
    return this.suppliersService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Supplier retrieved successfully',
    type: SupplierResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Supplier not found' })
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.suppliersService.findOne(user.id, id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update a supplier by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Supplier updated successfully',
    type: SupplierResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Supplier not found' })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a supplier by id' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Supplier deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Supplier not found' })
  async remove(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.suppliersService.remove(user.id, id);
  }
}
