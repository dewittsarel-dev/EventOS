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
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { FindQuotationsQueryDto } from './dto/find-quotations-query.dto';
import {
  QuotationListResponseDto,
  QuotationResponseDto,
} from './dto/quotation-response.dto';
import { QuotationSortBy, QuotationSortOrder } from './dto/quotation-sort.enum';
import { QuotationStatus } from './dto/quotation-status.enum';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('quotations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a quotation' })
  @ApiCreatedResponse({
    description: 'Quotation created successfully',
    type: QuotationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization/contact/event',
  })
  create(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotationsService.create(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List quotations for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', enum: QuotationStatus, required: false })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'sortBy', enum: QuotationSortBy, required: false })
  @ApiQuery({ name: 'sort', enum: QuotationSortOrder, required: false })
  @ApiQuery({ name: 'includeArchived', required: false })
  @ApiOkResponse({
    description: 'Quotations retrieved successfully',
    type: QuotationListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindQuotationsQueryDto,
  ) {
    return this.quotationsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quotation by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Quotation retrieved successfully',
    type: QuotationResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.quotationsService.findOne(user.id, id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update a quotation by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Quotation updated successfully',
    type: QuotationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization/contact/event',
  })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
  ) {
    return this.quotationsService.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update quotation status' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Quotation status updated successfully',
    type: QuotationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  updateStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
  ) {
    return this.quotationsService.updateStatus(user.id, id, dto);
  }

  @Patch(':id/archive')
  @HttpCode(204)
  @ApiOperation({ summary: 'Archive a quotation' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Quotation archived successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  async archive(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.quotationsService.archive(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a quotation permanently' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Quotation deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  async remove(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.quotationsService.remove(user.id, id);
  }
}
