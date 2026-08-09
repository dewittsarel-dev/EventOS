import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  MarketplaceCustomerEnquiryDto,
  MarketplaceCustomerLoginDto,
  MarketplaceCustomerRegisterDto,
  MarketplaceEnquiryMessageDto,
  MarketplaceShortlistDto,
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
export class MarketplaceCustomerController {
  constructor(private readonly customers: MarketplaceCustomerService) {}

  @Post('register') register(@Body() dto: MarketplaceCustomerRegisterDto) {
    return this.customers.register(dto);
  }
  @Post('login') login(@Body() dto: MarketplaceCustomerLoginDto) {
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
}
