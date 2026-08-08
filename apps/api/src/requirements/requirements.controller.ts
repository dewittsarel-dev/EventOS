import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRequirementSetDto } from './dto/create-requirement-set.dto';
import { OverrideRequirementDto } from './dto/override-requirement.dto';
import {
  ApplyRequirementImpactReportDto,
  CreateRequirementImpactReportDto,
} from './dto/requirement-impact-report.dto';
import { RequirementImpactService } from './requirement-impact.service';
import { RequirementsService } from './requirements.service';

@ApiTags('requirements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('events/:eventId/requirement-sets')
export class RequirementsController {
  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly requirementImpactService: RequirementImpactService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a versioned Requirement Set' })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Body() dto: CreateRequirementSetDto,
  ) {
    return this.requirementsService.createSet(user.id, eventId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List Requirement Set versions, newest first' })
  list(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
  ) {
    return this.requirementsService.listSets(user.id, eventId);
  }

  @Post(':setId/approve')
  @ApiOperation({ summary: 'Approve a Requirement Set for downstream use' })
  approve(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('setId') setId: string,
  ) {
    return this.requirementsService.approveSet(user.id, eventId, setId);
  }

  @Post(':setId/quantity-override')
  @ApiOperation({ summary: 'Create a new set version with a planner override' })
  override(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('setId') setId: string,
    @Body() dto: OverrideRequirementDto,
  ) {
    return this.requirementsService.overrideQuantity(
      user.id,
      eventId,
      setId,
      dto,
    );
  }

  @Post(':setId/impact-reports')
  @ApiOperation({
    summary: 'Compare proposed requirements and create an Impact Report',
  })
  createImpactReport(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('setId') setId: string,
    @Body() dto: CreateRequirementImpactReportDto,
  ) {
    return this.requirementImpactService.createReport(
      user.id,
      eventId,
      setId,
      dto,
    );
  }

  @Get('impact-reports/all')
  @ApiOperation({ summary: 'List Requirement Impact Reports' })
  listImpactReports(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
  ) {
    return this.requirementImpactService.listReports(user.id, eventId);
  }

  @Post('impact-reports/:reportId/apply')
  @ApiOperation({
    summary:
      'Apply explicit planner decisions as a new Requirement Set version',
  })
  applyImpactReport(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('reportId') reportId: string,
    @Body() dto: ApplyRequirementImpactReportDto,
  ) {
    return this.requirementImpactService.applyReport(
      user.id,
      eventId,
      reportId,
      dto,
    );
  }
}
