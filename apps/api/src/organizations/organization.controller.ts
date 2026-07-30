import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import {
  OrganizationListResponseDto,
  OrganizationResponseDto,
} from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create an organization' })
  @ApiCreatedResponse({ description: 'Organization created successfully' })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationService.create(createOrganizationDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List organizations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiOkResponse({
    description: 'Organizations retrieved successfully',
    type: OrganizationListResponseDto,
  })
  findAll(@Query() query: FindOrganizationsQueryDto) {
    return this.organizationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by id' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({
    description: 'Organization retrieved successfully',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Organization updated successfully' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Organization deleted successfully' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  remove(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }
}
