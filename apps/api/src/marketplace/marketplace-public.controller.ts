import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CreateMarketplaceEnquiryDto } from './dto/create-marketplace-enquiry.dto';
import { FindMarketplaceListingsQueryDto } from './dto/find-marketplace-listings-query.dto';
import { MarketplacePublicService } from './marketplace-public.service';

@ApiTags('public-marketplace')
@Controller('public/marketplace')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MarketplacePublicController {
  constructor(private readonly marketplace: MarketplacePublicService) {}

  @Get('listings')
  @ApiOperation({
    summary: 'Browse explicitly published Marketplace listings.',
  })
  @ApiOkResponse({ description: 'Published listings only.' })
  findListings(@Query() query: FindMarketplaceListingsQueryDto) {
    return this.marketplace.findListings(query);
  }

  @Get('listings/:id')
  @ApiOkResponse({ description: 'Published listing.' })
  findListing(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplace.findListing(id);
  }

  @Post('enquiries')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCreatedResponse({
    description: 'Enquiry accepted for supplier follow-up.',
  })
  createEnquiry(@Body() dto: CreateMarketplaceEnquiryDto) {
    return this.marketplace.createEnquiry(dto);
  }
}
