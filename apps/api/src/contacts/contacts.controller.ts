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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ContactListResponseDto,
  ContactResponseDto,
} from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { FindContactsQueryDto } from './dto/find-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsService } from './contacts.service';

@ApiTags('contacts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a contact' })
  @ApiCreatedResponse({
    description: 'Contact created successfully',
    type: ContactResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  create(@CurrentUser() user: UserResponseDto, @Body() dto: CreateContactDto) {
    return this.contactsService.create(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List contacts for an organization' })
  @ApiQuery({ name: 'organizationId', type: String, required: true })
  @ApiOkResponse({
    description: 'Contacts retrieved successfully',
    type: ContactListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindContactsQueryDto,
  ) {
    return this.contactsService.findAll(user.id, query.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Contact retrieved successfully',
    type: ContactResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Contact not found' })
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.contactsService.findOne(user.id, id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update a contact by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Contact updated successfully',
    type: ContactResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Contact not found' })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a contact by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse({ description: 'Contact deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Contact not found' })
  async remove(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.contactsService.remove(user.id, id);
  }
}
