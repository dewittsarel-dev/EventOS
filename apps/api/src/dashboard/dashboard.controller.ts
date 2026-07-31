import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Get dashboard overview for an organization' })
  @ApiQuery({ name: 'organizationId', type: String, required: true })
  @ApiQuery({ name: 'upcomingLimit', type: Number, required: false })
  @ApiQuery({ name: 'tasksLimit', type: Number, required: false })
  @ApiQuery({ name: 'activityLimit', type: Number, required: false })
  @ApiOkResponse({
    description: 'Dashboard overview retrieved successfully',
    type: DashboardOverviewResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'No access to organization' })
  findOverview(
    @CurrentUser() user: UserResponseDto,
    @Query() query: GetDashboardQueryDto,
  ) {
    return this.dashboardService.getOverview(user.id, query);
  }
}
