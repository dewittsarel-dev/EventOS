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
import { CreateEventDto } from './dto/create-event.dto';
import {
  EventListResponseDto,
  EventResponseDto,
} from './dto/event-response.dto';
import {
  EventSortOrder,
  FindEventsQueryDto,
} from './dto/find-events-query.dto';
import { EventStatus } from './dto/event-status.enum';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create an event' })
  @ApiCreatedResponse({
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization or contact' })
  create(@CurrentUser() user: UserResponseDto, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List events for an organization' })
  @ApiQuery({ name: 'organizationId', type: String, required: true })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'eventType', type: String, required: false })
  @ApiQuery({ name: 'assignedUserId', type: String, required: false })
  @ApiQuery({ name: 'status', enum: EventStatus, required: false })
  @ApiQuery({ name: 'sort', enum: EventSortOrder, required: false })
  @ApiOkResponse({
    description: 'Events retrieved successfully',
    type: EventListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindEventsQueryDto,
  ) {
    return this.eventsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Event retrieved successfully',
    type: EventResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.eventsService.findOne(user.id, id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update an event by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization or contact' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an event by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse({ description: 'Event deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  async remove(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.eventsService.remove(user.id, id);
  }
}
