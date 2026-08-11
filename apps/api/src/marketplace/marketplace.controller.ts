import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  MarketplaceCapabilitySearchDto,
  MarketplaceSupplierShortfallRequestDto,
} from './dto/marketplace-capability-search.dto';
import {
  MarketplaceCapabilitySearchResponseDto,
  MarketplaceSupplierShortfallSummaryDto,
} from './dto/marketplace-capability-response.dto';
import { MarketplaceCapabilityService } from './marketplace-capability.service';
import { FindMarketplaceEnquiriesQueryDto } from './dto/find-marketplace-enquiries-query.dto';
import { MarketplacePublicService } from './marketplace-public.service';
import { UpdateMarketplaceEnquiryStatusDto } from './dto/update-marketplace-enquiry-status.dto';
import {
  ConvertSalesOpportunityDto,
  CreateSalesOpportunityDto,
  UpdateSalesOpportunityDto,
} from './dto/sales-opportunity.dto';
import { MarketplaceEnquiryMessageDto } from './dto/marketplace-customer.dto';
import {
  CreateMarketplacePreliminaryQuoteDto,
  SendMarketplacePreliminaryQuoteDto,
} from './dto/marketplace-preliminary-quote.dto';

@ApiTags('marketplace')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceCapabilityService: MarketplaceCapabilityService,
    private readonly marketplacePublicService: MarketplacePublicService,
  ) {}

  @Get('enquiries')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary:
      'List Marketplace enquiries received by the active supplier organization.',
  })
  @ApiOkResponse({ description: 'Private organization enquiry inbox.' })
  getEnquiries(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindMarketplaceEnquiriesQueryDto,
  ) {
    return this.marketplacePublicService.findOrganizationEnquiries(
      user.id,
      query.organizationId,
    );
  }

  @Patch('enquiries/:id/status')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Record the operator-controlled status of a Marketplace enquiry.',
  })
  @ApiOkResponse({ description: 'Enquiry status updated and audited.' })
  updateEnquiryStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) enquiryId: string,
    @Body() dto: UpdateMarketplaceEnquiryStatusDto,
  ) {
    return this.marketplacePublicService.updateEnquiryStatus(
      user.id,
      dto.organizationId,
      enquiryId,
      dto.status,
    );
  }

  @Post('enquiries/:id/messages')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  sendEnquiryMessage(
    @CurrentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) enquiryId: string,
    @Body() dto: MarketplaceEnquiryMessageDto,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.marketplacePublicService.sendOrganizationMessage(
      user.id,
      organizationId,
      enquiryId,
      dto.body,
    );
  }

  @Post('enquiries/:id/preliminary-quotes')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createPreliminaryQuote(
    @CurrentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) enquiryId: string,
    @Body() dto: CreateMarketplacePreliminaryQuoteDto,
  ) {
    return this.marketplacePublicService.createPreliminaryQuote(
      user.id,
      enquiryId,
      dto,
    );
  }

  @Post('enquiries/:id/preliminary-quotes/:quoteId/send')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  sendPreliminaryQuote(
    @CurrentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) enquiryId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Body() dto: SendMarketplacePreliminaryQuoteDto,
  ) {
    return this.marketplacePublicService.sendPreliminaryQuote(
      user.id,
      dto.organizationId,
      enquiryId,
      quoteId,
    );
  }

  @Post('enquiries/:id/opportunity')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOpportunity(
    @CurrentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) enquiryId: string,
    @Body() dto: CreateSalesOpportunityDto,
  ) {
    return this.marketplacePublicService.createSalesOpportunity(
      user.id,
      dto.organizationId,
      enquiryId,
    );
  }

  @Patch('opportunities/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOpportunity(
    @CurrentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) opportunityId: string,
    @Body() dto: UpdateSalesOpportunityDto,
  ) {
    return this.marketplacePublicService.updateSalesOpportunity(
      user.id,
      opportunityId,
      dto,
    );
  }

  @Post('opportunities/:id/convert-to-event')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  convertOpportunity(
    @CurrentUser() user: UserResponseDto,
    @Param('id', ParseUUIDPipe) opportunityId: string,
    @Body() dto: ConvertSalesOpportunityDto,
  ) {
    return this.marketplacePublicService.convertSalesOpportunity(
      user.id,
      opportunityId,
      dto,
    );
  }

  @Post('capability/search')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary:
      'Classify supplier capability for buyer requirements using own stock and date-valid marketplace sourcing.',
  })
  @ApiOkResponse({
    description: 'Capability evaluation completed.',
    type: MarketplaceCapabilitySearchResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization context' })
  searchCapability(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: MarketplaceCapabilitySearchDto,
  ) {
    return this.marketplaceCapabilityService.searchCapability(user.id, dto);
  }

  @Post('capability/supplier-shortfall-summary')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary:
      'Prepare non-committing supplier shortfall summary for RFQ handling with manual sourcing control.',
  })
  @ApiOkResponse({
    description: 'Supplier shortfall summary prepared.',
    type: MarketplaceSupplierShortfallSummaryDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization context' })
  getSupplierShortfallSummary(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: MarketplaceSupplierShortfallRequestDto,
  ) {
    return this.marketplaceCapabilityService.getSupplierShortfallSummary(
      user.id,
      dto,
    );
  }
}
