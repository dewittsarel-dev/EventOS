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
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteOrganizationUserDto } from './dto/invite-organization-user.dto';
import { OrganizationContextQueryDto } from './dto/organization-context-query.dto';
import {
  OrganizationUserListResponseDto,
  OrganizationUserResponseDto,
} from './dto/organization-user-response.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';
import { OrganizationService } from './organization.service';

@ApiTags('organization-users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organization/users')
export class OrganizationUsersController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List users for the active organization' })
  @ApiOkResponse({
    description: 'Organization users retrieved successfully',
    type: OrganizationUserListResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid organization context' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findUsers(
    @CurrentUser() user: UserResponseDto,
    @Query() query: OrganizationContextQueryDto,
  ) {
    return this.organizationService.listOrganizationUsers(
      user.id,
      query.organizationId,
    );
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Invite a user to the active organization' })
  @ApiOkResponse({
    description: 'User invited successfully',
    type: OrganizationUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  inviteUser(
    @CurrentUser() user: UserResponseDto,
    @Query() query: OrganizationContextQueryDto,
    @Body() dto: InviteOrganizationUserDto,
  ) {
    return this.organizationService.inviteOrganizationUser(
      user.id,
      query.organizationId,
      dto,
    );
  }

  @Patch(':userId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Edit an organization user profile and role' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: OrganizationUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Membership not found' })
  editUser(
    @CurrentUser() user: UserResponseDto,
    @Param('userId') userId: string,
    @Query() query: OrganizationContextQueryDto,
    @Body() dto: UpdateOrganizationUserDto,
  ) {
    return this.organizationService.updateOrganizationUser(
      user.id,
      query.organizationId,
      userId,
      dto,
    );
  }

  @Patch(':userId/disable')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Disable a user in the active organization' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    description: 'User disabled successfully',
    type: OrganizationUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid organization context' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Membership not found' })
  disableUser(
    @CurrentUser() user: UserResponseDto,
    @Param('userId') userId: string,
    @Query() query: OrganizationContextQueryDto,
  ) {
    return this.organizationService.setOrganizationUserDisabled(
      user.id,
      query.organizationId,
      userId,
      true,
    );
  }

  @Patch(':userId/enable')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Enable a user in the active organization' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    description: 'User enabled successfully',
    type: OrganizationUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid organization context' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Membership not found' })
  enableUser(
    @CurrentUser() user: UserResponseDto,
    @Param('userId') userId: string,
    @Query() query: OrganizationContextQueryDto,
  ) {
    return this.organizationService.setOrganizationUserDisabled(
      user.id,
      query.organizationId,
      userId,
      false,
    );
  }

  @Delete(':userId')
  @HttpCode(204)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Delete an organization user membership' })
  @ApiParam({ name: 'userId', type: String })
  @ApiNoContentResponse({
    description: 'User deleted from organization successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid organization context' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Membership not found' })
  async deleteUser(
    @CurrentUser() user: UserResponseDto,
    @Param('userId') userId: string,
    @Query() query: OrganizationContextQueryDto,
  ) {
    await this.organizationService.deleteOrganizationUser(
      user.id,
      query.organizationId,
      userId,
    );
  }
}
