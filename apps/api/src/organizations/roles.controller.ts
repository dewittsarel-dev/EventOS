import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { OrganizationContextQueryDto } from './dto/organization-context-query.dto';
import { RoleListResponseDto, RoleResponseDto } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { OrganizationService } from './organization.service';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List roles for the active organization' })
  @ApiOkResponse({
    description: 'Roles retrieved successfully',
    type: RoleListResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid organization context' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: OrganizationContextQueryDto,
  ) {
    return this.organizationService.listRoles(user.id, query.organizationId);
  }

  @Get(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Get a role by id for the active organization' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Role retrieved successfully',
    type: RoleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid organization context' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  findOne(
    @CurrentUser() user: UserResponseDto,
    @Param('id') roleId: string,
    @Query() query: OrganizationContextQueryDto,
  ) {
    return this.organizationService.findRoleById(
      user.id,
      query.organizationId,
      roleId,
    );
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a custom role in the active organization' })
  @ApiCreatedResponse({
    description: 'Role created successfully',
    type: RoleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  create(
    @CurrentUser() user: UserResponseDto,
    @Query() query: OrganizationContextQueryDto,
    @Body() dto: CreateRoleDto,
  ) {
    return this.organizationService.createRole(
      user.id,
      query.organizationId,
      dto,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Update an existing role in the active organization',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Role updated successfully',
    type: RoleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') roleId: string,
    @Query() query: OrganizationContextQueryDto,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.organizationService.updateRole(
      user.id,
      query.organizationId,
      roleId,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Delete a custom role from the active organization',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse({ description: 'Role deleted successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid organization context or protected role',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('id') roleId: string,
    @Query() query: OrganizationContextQueryDto,
  ) {
    await this.organizationService.deleteRole(
      user.id,
      query.organizationId,
      roleId,
    );
  }
}
