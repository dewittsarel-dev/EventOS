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
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
  CreateMeetingNoteDto,
  MeetingActionItemInputDto,
  MeetingAttendeeInputDto,
} from './dto/create-meeting-note.dto';
import { FindMeetingNotesQueryDto } from './dto/find-meeting-notes-query.dto';
import {
  MeetingNoteListResponseDto,
  MeetingNoteResponseDto,
} from './dto/meeting-note-response.dto';
import { UpdateMeetingNoteDto } from './dto/update-meeting-note.dto';
import { MeetingNotesService } from './meeting-notes.service';

@ApiTags('meeting-notes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('meeting-notes')
export class MeetingNotesController {
  constructor(private readonly meetingNotesService: MeetingNotesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a meeting note' })
  @ApiCreatedResponse({ type: MeetingNoteResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization or event' })
  create(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateMeetingNoteDto,
  ) {
    return this.meetingNotesService.create(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List meeting notes' })
  @ApiQuery({ name: 'organizationId', type: String, required: true })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'eventId', type: String, required: false })
  @ApiQuery({ name: 'meetingType', type: String, required: false })
  @ApiQuery({ name: 'dateFrom', type: String, required: false })
  @ApiQuery({ name: 'dateTo', type: String, required: false })
  @ApiQuery({ name: 'sort', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOkResponse({ type: MeetingNoteListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindMeetingNotesQueryDto,
  ) {
    return this.meetingNotesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting note details' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: MeetingNoteResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Meeting note not found' })
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.meetingNotesService.findOne(user.id, id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update a meeting note' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: MeetingNoteResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization or event' })
  @ApiNotFoundResponse({ description: 'Meeting note not found' })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingNoteDto,
  ) {
    return this.meetingNotesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a meeting note' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse({ description: 'Meeting note deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Meeting note not found' })
  async remove(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.meetingNotesService.remove(user.id, id);
  }

  @Post(':id/attendees')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Add attendee to meeting note' })
  @ApiParam({ name: 'id', type: String })
  @ApiCreatedResponse({ type: MeetingNoteResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Meeting note not found' })
  addAttendee(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: MeetingAttendeeInputDto,
  ) {
    return this.meetingNotesService.addAttendee(user.id, id, dto);
  }

  @Patch(':id/attendees/:attendeeId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update meeting attendee' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'attendeeId', type: String })
  @ApiOkResponse({ type: MeetingNoteResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Meeting note or attendee not found' })
  updateAttendee(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Param('attendeeId') attendeeId: string,
    @Body() dto: MeetingAttendeeInputDto,
  ) {
    return this.meetingNotesService.updateAttendee(
      user.id,
      id,
      attendeeId,
      dto,
    );
  }

  @Delete(':id/attendees/:attendeeId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove meeting attendee' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'attendeeId', type: String })
  @ApiNoContentResponse({ description: 'Attendee removed successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Meeting note or attendee not found' })
  async removeAttendee(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Param('attendeeId') attendeeId: string,
  ) {
    await this.meetingNotesService.removeAttendee(user.id, id, attendeeId);
  }

  @Post(':id/action-items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Add action item to meeting note' })
  @ApiParam({ name: 'id', type: String })
  @ApiCreatedResponse({ type: MeetingNoteResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or user/task',
  })
  @ApiNotFoundResponse({ description: 'Meeting note not found' })
  addActionItem(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: MeetingActionItemInputDto,
  ) {
    return this.meetingNotesService.addActionItem(user.id, id, dto);
  }

  @Patch(':id/action-items/:actionItemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update action item' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'actionItemId', type: String })
  @ApiOkResponse({ type: MeetingNoteResponseDto })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization or user/task',
  })
  @ApiNotFoundResponse({ description: 'Meeting note or action item not found' })
  updateActionItem(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Param('actionItemId') actionItemId: string,
    @Body() dto: MeetingActionItemInputDto,
  ) {
    return this.meetingNotesService.updateActionItem(
      user.id,
      id,
      actionItemId,
      dto,
    );
  }

  @Delete(':id/action-items/:actionItemId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove action item' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'actionItemId', type: String })
  @ApiNoContentResponse({ description: 'Action item removed successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Meeting note or action item not found' })
  async removeActionItem(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Param('actionItemId') actionItemId: string,
  ) {
    await this.meetingNotesService.removeActionItem(user.id, id, actionItemId);
  }

  @Post(':id/action-items/:actionItemId/convert-task')
  @HttpCode(201)
  @ApiOperation({ summary: 'Convert meeting action item into a task' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'actionItemId', type: String })
  @ApiCreatedResponse({ description: 'Action item converted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Meeting note or action item not found' })
  convertActionItemToTask(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Param('actionItemId') actionItemId: string,
  ) {
    return this.meetingNotesService.convertActionItemToTask(
      user.id,
      id,
      actionItemId,
    );
  }
}
