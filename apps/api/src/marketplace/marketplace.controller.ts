import {
  Body,
  Controller,
  Post,
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

@ApiTags('marketplace')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceCapabilityService: MarketplaceCapabilityService,
  ) {}

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
