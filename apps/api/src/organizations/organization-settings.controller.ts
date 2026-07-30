import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { OrganizationService } from './organization.service';
import { OrganizationContextQueryDto } from './dto/organization-context-query.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationLogoDto } from './dto/update-organization-logo.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

@ApiTags('organization')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organization')
export class OrganizationSettingsController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Get active organization settings' })
  @ApiOkResponse({
    description: 'Organization settings returned successfully',
    type: OrganizationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid organization context' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  getOrganization(
    @CurrentUser() user: UserResponseDto,
    @Query() query: OrganizationContextQueryDto,
  ) {
    return this.organizationService.findAccessibleById(
      user.id,
      query.organizationId,
    );
  }

  @Put()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update active organization settings' })
  @ApiOkResponse({
    description: 'Organization settings updated successfully',
    type: OrganizationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  updateOrganization(
    @CurrentUser() user: UserResponseDto,
    @Query() query: OrganizationContextQueryDto,
    @Body() dto: UpdateOrganizationSettingsDto,
  ) {
    return this.organizationService.updateSettings(
      user.id,
      query.organizationId,
      dto,
    );
  }

  @Patch('logo')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update organization logo placeholder URL' })
  @ApiOkResponse({
    description: 'Organization logo updated successfully',
    type: OrganizationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  updateOrganizationLogo(
    @CurrentUser() user: UserResponseDto,
    @Query() query: OrganizationContextQueryDto,
    @Body() dto: UpdateOrganizationLogoDto,
  ) {
    return this.organizationService.updateLogo(
      user.id,
      query.organizationId,
      dto.logoUrl,
    );
  }
}
