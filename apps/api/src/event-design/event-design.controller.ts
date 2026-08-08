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
import { CreateClientBriefVersionDto } from './dto/create-client-brief-version.dto';
import { CreateEventDesignVersionDto } from './dto/create-event-design-version.dto';
import { EventDesignService } from './event-design.service';

@ApiTags('event-design')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('events/:eventId')
export class EventDesignController {
  constructor(private readonly eventDesignService: EventDesignService) {}

  @Post('client-brief-versions')
  @ApiOperation({ summary: 'Create an immutable Client Brief version' })
  createClientBrief(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Body() dto: CreateClientBriefVersionDto,
  ) {
    return this.eventDesignService.createClientBriefVersion(
      user.id,
      eventId,
      dto,
    );
  }

  @Get('client-brief-versions')
  @ApiOperation({ summary: 'List Client Brief versions, newest first' })
  listClientBriefs(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
  ) {
    return this.eventDesignService.listClientBriefVersions(user.id, eventId);
  }

  @Post('event-design-versions')
  @ApiOperation({ summary: 'Create an immutable Event Design version' })
  createEventDesign(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventDesignVersionDto,
  ) {
    return this.eventDesignService.createEventDesignVersion(
      user.id,
      eventId,
      dto,
    );
  }

  @Get('event-design-versions')
  @ApiOperation({ summary: 'List Event Design versions, newest first' })
  listEventDesigns(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
  ) {
    return this.eventDesignService.listEventDesignVersions(user.id, eventId);
  }

  @Post('event-design-versions/:designId/approve')
  @ApiOperation({ summary: 'Approve an Event Design version' })
  approveEventDesign(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('designId') designId: string,
  ) {
    return this.eventDesignService.approveEventDesignVersion(
      user.id,
      eventId,
      designId,
    );
  }
}
