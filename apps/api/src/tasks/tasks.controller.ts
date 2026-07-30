import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { TaskPriority } from './dto/task-priority.enum';
import { TaskListResponseDto, TaskResponseDto } from './dto/task-response.dto';
import { TaskSortBy, TaskSortOrder } from './dto/task-sort.enum';
import { TaskStatus } from './dto/task-status.enum';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a task' })
  @ApiCreatedResponse({
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization/event/contact',
  })
  create(@CurrentUser() user: UserResponseDto, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'List tasks for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'assignedUserId', required: false })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'priority', enum: TaskPriority, required: false })
  @ApiQuery({ name: 'dueFrom', required: false })
  @ApiQuery({ name: 'dueTo', required: false })
  @ApiQuery({ name: 'sortBy', enum: TaskSortBy, required: false })
  @ApiQuery({ name: 'sort', enum: TaskSortOrder, required: false })
  @ApiQuery({ name: 'includeArchived', required: false })
  @ApiOkResponse({
    description: 'Tasks retrieved successfully',
    type: TaskListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: FindTasksQueryDto,
  ) {
    return this.tasksService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Task retrieved successfully',
    type: TaskResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.tasksService.findOne(user.id, id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description: 'No access to organization/event/contact',
  })
  @ApiNotFoundResponse({ description: 'Task not found' })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update a task status' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'Task status updated successfully',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  updateStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(user.id, id, dto);
  }

  @Patch(':id/archive')
  @HttpCode(204)
  @ApiOperation({ summary: 'Archive a task' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Task archived successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async archive(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.tasksService.archive(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a task permanently' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Task deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async remove(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    await this.tasksService.remove(user.id, id);
  }
}
