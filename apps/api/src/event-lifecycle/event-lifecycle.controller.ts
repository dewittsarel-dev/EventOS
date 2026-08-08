import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventLifecycleService } from './event-lifecycle.service';

@ApiTags('event-lifecycle')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations/:organizationId/events/:eventId/lifecycle')
export class EventLifecycleController {
  constructor(private readonly service: EventLifecycleService) {}
  @Get('continuity') continuity(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
  ) {
    return this.service.continuity(u.id, o, e);
  }
  @Post('synchronize') synchronize(
    @CurrentUser() u: UserResponseDto,
    @Param('organizationId') o: string,
    @Param('eventId') e: string,
  ) {
    return this.service.synchronize(u.id, o, e);
  }
}
