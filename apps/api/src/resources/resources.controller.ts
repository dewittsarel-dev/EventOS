import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { EventResourceAllocationsQueryDto } from './dto/event-resource-allocations-query.dto';
import { ResourceReservationsQueryDto } from './dto/resource-reservations-query.dto';
import { ReserveEventResourcesDto } from './dto/reserve-event-resources.dto';
import { SearchResourcesQueryDto } from './dto/search-resources-query.dto';
import { SourceReservationsQueryDto } from './dto/source-reservations-query.dto';
import { TransitionReservationDto } from './dto/transition-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { AvailabilityCalendarQueryDto } from './dto/availability-calendar-query.dto';
import { ResourceEngineService } from './resource-engine.service';

@ApiTags('resources')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourceEngineService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createResource(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourcesService.createResource({
      actorUserId: user.id,
      ...dto,
    });
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateResource(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.updateResource({
      actorUserId: user.id,
      resourceId: id,
      ...dto,
    });
  }

  @Patch(':id/archive')
  archiveResource(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    return this.resourcesService.archiveResource({
      actorUserId: user.id,
      resourceId: id,
    });
  }

  @Patch(':id/restore')
  restoreResource(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    return this.resourcesService.restoreResource({
      actorUserId: user.id,
      resourceId: id,
    });
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  searchResources(
    @CurrentUser() user: UserResponseDto,
    @Query() query: SearchResourcesQueryDto,
  ) {
    return this.resourcesService.searchResources({
      actorUserId: user.id,
      ...query,
    });
  }

  @Get('reservations/source')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getReservationsForSource(
    @CurrentUser() user: UserResponseDto,
    @Query() query: SourceReservationsQueryDto,
  ) {
    return this.resourcesService.getReservationsForSource({
      actorUserId: user.id,
      ...query,
    });
  }

  @Get(':id')
  getResource(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.resourcesService.getResource({
      actorUserId: user.id,
      resourceId: id,
    });
  }

  @Get(':id/availability-summary')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getAvailabilitySummary(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.resourcesService.getResourceAvailabilitySummary({
      actorUserId: user.id,
      organizationId,
      resourceId: id,
    });
  }

  @Post(':id/availability/check')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  checkAvailability(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.resourcesService.checkAvailability({
      actorUserId: user.id,
      resourceId: id,
      ...dto,
    });
  }

  @Get(':id/availability-calendar')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getAvailabilityCalendar(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Query() query: AvailabilityCalendarQueryDto,
  ) {
    return this.resourcesService.getAvailabilityCalendar({
      actorUserId: user.id,
      resourceId: id,
      ...query,
    });
  }

  @Post(':id/reservations')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createReservation(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.resourcesService.createReservation({
      actorUserId: user.id,
      resourceId: id,
      ...dto,
    });
  }

  @Get(':id/reservations')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getReservationsForResource(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Query() query: ResourceReservationsQueryDto,
  ) {
    return this.resourcesService.getReservationsForResource({
      actorUserId: user.id,
      resourceId: id,
      ...query,
    });
  }

  @Patch('reservations/:reservationId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateReservation(
    @CurrentUser() user: UserResponseDto,
    @Param('reservationId') reservationId: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.resourcesService.updateReservation({
      actorUserId: user.id,
      reservationId,
      ...dto,
    });
  }

  @Patch('reservations/:reservationId/confirm')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  confirmReservation(
    @CurrentUser() user: UserResponseDto,
    @Param('reservationId') reservationId: string,
    @Body() dto: TransitionReservationDto,
  ) {
    return this.resourcesService.confirmReservation({
      actorUserId: user.id,
      reservationId,
      notes: dto.notes,
    });
  }

  @Patch('reservations/:reservationId/release')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  releaseReservation(
    @CurrentUser() user: UserResponseDto,
    @Param('reservationId') reservationId: string,
    @Body() dto: TransitionReservationDto,
  ) {
    return this.resourcesService.releaseReservation({
      actorUserId: user.id,
      reservationId,
      notes: dto.notes,
    });
  }

  @Patch('reservations/:reservationId/cancel')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  cancelReservation(
    @CurrentUser() user: UserResponseDto,
    @Param('reservationId') reservationId: string,
    @Body() dto: TransitionReservationDto,
  ) {
    return this.resourcesService.cancelReservation({
      actorUserId: user.id,
      reservationId,
      notes: dto.notes,
    });
  }

  @Post('events/:eventId/reserve')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  reserveResourcesForEvent(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Body() dto: ReserveEventResourcesDto,
  ) {
    return this.resourcesService.reserveResourcesForEvent({
      actorUserId: user.id,
      organizationId: dto.organizationId,
      eventId,
      requests: dto.requests,
    });
  }

  @Get('events/:eventId/allocations')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getEventAllocations(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Query() query: EventResourceAllocationsQueryDto,
  ) {
    return this.resourcesService.getEventResourceAllocations({
      actorUserId: user.id,
      organizationId: query.organizationId,
      eventId,
    });
  }

  @Patch('events/:eventId/release-completed')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  releaseEventAllocationsCompleted(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.resourcesService.releaseEventAllocations({
      actorUserId: user.id,
      organizationId,
      eventId,
      reason: 'Completed',
    });
  }

  @Patch('events/:eventId/release-cancelled')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  releaseEventAllocationsCancelled(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.resourcesService.releaseEventAllocations({
      actorUserId: user.id,
      organizationId,
      eventId,
      reason: 'Cancelled',
    });
  }

  @Get(':id/allocation-history')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getResourceAllocationHistory(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.resourcesService.getResourceAllocationHistory({
      actorUserId: user.id,
      organizationId,
      resourceId: id,
    });
  }
}
