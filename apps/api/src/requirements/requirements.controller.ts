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
import { RequirementsService } from './requirements.service';

@ApiTags('requirements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('events/:eventId/requirement-sets')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

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
}
