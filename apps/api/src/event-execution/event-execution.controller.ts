import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AssessExecutionGateDto,
  BuildExecutionPlanDto,
  ChangeExecutionIncidentStatusDto,
  ChangeExecutionTaskStatusDto,
  CompleteCloseoutItemDto,
  CreateCloseoutItemDto,
  CreateExecutionDto,
  CreateExecutionIncidentDto,
  CreateExecutionTaskDto,
  CreateSiteControlDto,
  RecordCommandLogDto,
  RecordCommissioningCheckDto,
  RecordExecutionAcceptanceDto,
  SetRunOfShowDto,
} from './dto/event-execution.dto';
import { EventExecutionService } from './event-execution.service';

@ApiTags('event-execution')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('organizations/:organizationId/events/:eventId/execution')
export class EventExecutionController {
  constructor(private readonly service: EventExecutionService) {}

  @Post()
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateExecutionDto,
  ) {
    return this.service.createExecution({
      organizationId,
      eventId,
      actorId: user.id,
      summary: dto.summary,
    });
  }

  @Post('plan')
  buildPlan(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: BuildExecutionPlanDto,
  ) {
    return this.service.buildExecutionPlan({
      organizationId,
      eventId,
      actorId: user.id,
      planningContext: dto.planningContext,
    });
  }

  @Get()
  getWorkspace(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.getWorkspace(user.id, organizationId, eventId);
  }

  @Post('tasks')
  createTask(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateExecutionTaskDto,
  ) {
    return this.service.createTask(user.id, organizationId, eventId, dto);
  }

  @Patch('tasks/:taskId/status')
  changeTaskStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Param('taskId') taskId: string,
    @Body() dto: ChangeExecutionTaskStatusDto,
  ) {
    return this.service.changeTaskStatus(
      user.id,
      organizationId,
      eventId,
      taskId,
      dto,
    );
  }

  @Post('gates')
  assessGate(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: AssessExecutionGateDto,
  ) {
    return this.service.assessGate(user.id, organizationId, eventId, dto);
  }

  @Post('site-controls')
  createSiteControl(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateSiteControlDto,
  ) {
    return this.service.createSiteControl(
      user.id,
      organizationId,
      eventId,
      dto,
    );
  }

  @Post('commissioning-checks')
  recordCommissioning(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: RecordCommissioningCheckDto,
  ) {
    return this.service.recordCommissioning(
      user.id,
      organizationId,
      eventId,
      dto,
    );
  }

  @Post('acceptances')
  recordAcceptance(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: RecordExecutionAcceptanceDto,
  ) {
    return this.service.recordAcceptance(user.id, organizationId, eventId, dto);
  }

  @Post('go-live')
  approveGoLive(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.approveGoLive(user.id, organizationId, eventId);
  }

  @Post('run-of-show')
  setRunOfShow(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: SetRunOfShowDto,
  ) {
    return this.service.setRunOfShow(user.id, organizationId, eventId, dto);
  }

  @Post('command-log')
  recordCommandLog(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: RecordCommandLogDto,
  ) {
    return this.service.recordCommandLog(user.id, organizationId, eventId, dto);
  }

  @Post('incidents')
  createIncident(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateExecutionIncidentDto,
  ) {
    return this.service.createIncident(user.id, organizationId, eventId, dto);
  }

  @Patch('incidents/:incidentId/status')
  changeIncidentStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Param('incidentId') incidentId: string,
    @Body() dto: ChangeExecutionIncidentStatusDto,
  ) {
    return this.service.changeIncidentStatus(
      user.id,
      organizationId,
      eventId,
      incidentId,
      dto,
    );
  }

  @Post('closeout-items')
  createCloseoutItem(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateCloseoutItemDto,
  ) {
    return this.service.createCloseoutItem(
      user.id,
      organizationId,
      eventId,
      dto,
    );
  }

  @Patch('closeout-items/:itemId')
  completeCloseoutItem(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CompleteCloseoutItemDto,
  ) {
    return this.service.completeCloseoutItem(
      user.id,
      organizationId,
      eventId,
      itemId,
      dto,
    );
  }

  @Post('dispatch')
  dispatch(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.dispatch({ organizationId, eventId, actorId: user.id });
  }

  @Post('collect')
  collect(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.collect({ organizationId, eventId, actorId: user.id });
  }

  @Post('complete')
  complete(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.complete({ organizationId, eventId, actorId: user.id });
  }
}
