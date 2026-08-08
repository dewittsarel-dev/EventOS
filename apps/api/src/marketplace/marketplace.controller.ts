import {
  Body,
  Controller,
  Get,
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
