import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  MarketplaceCustomerEnquiryDto,
  MarketplaceCustomerLoginDto,
  MarketplaceCustomerRegisterDto,
  MarketplaceEnquiryMessageDto,
  MarketplaceEventConceptCreateDto,
  MarketplaceEventConceptSelectionDto,
  MarketplaceEventConceptUpdateDto,
  MarketplaceShortlistDto,
  ReplaceMarketplaceEventConceptSelectionDto,
  UpdateMarketplaceEventConceptSelectionDto,
} from './dto/marketplace-customer.dto';
import {
  CurrentMarketplaceCustomer,
  type AuthenticatedMarketplaceCustomer,
} from './marketplace-customer.decorator';
import { MarketplaceCustomerGuard } from './marketplace-customer.guard';
import { MarketplaceCustomerService } from './marketplace-customer.service';

@ApiTags('marketplace-customer')
@Controller('public/marketplace/customer')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(ThrottlerGuard)
export class MarketplaceCustomerController {
  constructor(private readonly customers: MarketplaceCustomerService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: MarketplaceCustomerRegisterDto) {
    return this.customers.register(dto);
  }
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: MarketplaceCustomerLoginDto) {
    return this.customers.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  me(@CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer) {
    return customer;
  }

  @Get('enquiries')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  enquiries(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
  ) {
    return this.customers.enquiries(customer.id);
  }

  @Post('enquiries')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  createEnquiry(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Body() dto: MarketplaceCustomerEnquiryDto,
  ) {
    return this.customers.createEnquiry(customer.id, dto);
  }

  @Post('enquiries/:id/messages')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  message(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarketplaceEnquiryMessageDto,
  ) {
    return this.customers.sendMessage(customer.id, id, dto.body);
  }

  @Get('shortlist')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  shortlist(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
  ) {
    return this.customers.shortlist(customer.id);
  }

  @Post('shortlist')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  addShortlist(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Body() dto: MarketplaceShortlistDto,
  ) {
    return this.customers.addShortlist(customer.id, dto.resourceId);
  }

  @Delete('shortlist/:resourceId')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  removeShortlist(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ) {
    return this.customers.removeShortlist(customer.id, resourceId);
  }

  @Get('event-concepts')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  eventConcepts(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
  ) {
    return this.customers.eventConcepts(customer.id);
  }

  @Post('event-concepts')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  createEventConcept(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Body() dto: MarketplaceEventConceptCreateDto,
  ) {
    return this.customers.createEventConcept(customer.id, dto);
  }

  @Get('event-concepts/:id')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  eventConcept(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customers.eventConcept(customer.id, id);
  }

  @Patch('event-concepts/:id')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  updateEventConcept(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarketplaceEventConceptUpdateDto,
  ) {
    return this.customers.updateEventConcept(customer.id, id, dto);
  }

  @Post('event-concepts/:id/selections')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  addEventConceptSelection(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarketplaceEventConceptSelectionDto,
  ) {
    return this.customers.addEventConceptSelection(customer.id, id, dto);
  }

  @Delete('event-concepts/:id/selections/:resourceId')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  removeEventConceptSelection(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ) {
    return this.customers.removeEventConceptSelection(
      customer.id,
      id,
      resourceId,
    );
  }

  @Patch('event-concepts/:id/selections/:resourceId')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  updateEventConceptSelection(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Body() dto: UpdateMarketplaceEventConceptSelectionDto,
  ) {
    return this.customers.updateEventConceptSelection(
      customer.id,
      id,
      resourceId,
      dto,
    );
  }

  @Post('event-concepts/:id/selections/:resourceId/replace')
  @UseGuards(MarketplaceCustomerGuard)
  @ApiBearerAuth('access-token')
  replaceEventConceptSelection(
    @CurrentMarketplaceCustomer() customer: AuthenticatedMarketplaceCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Body() dto: ReplaceMarketplaceEventConceptSelectionDto,
  ) {
    return this.customers.replaceEventConceptSelection(
      customer.id,
      id,
      resourceId,
      dto,
    );
  }
}
