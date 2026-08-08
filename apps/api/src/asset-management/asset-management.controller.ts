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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetManagementService } from './asset-management.service';
import {
  AssetSearchQueryDto,
  ChangeAssetLifecycleDto,
  CreateAssetDefinitionDto,
  CreateAssetBatchDto,
  CreateAssetKitDto,
  CreateAssetInstanceDto,
} from './dto/asset-identity.dto';
import {
  ChangeAssetDisposalStatusDto,
  ChangeAssetMaintenanceStatusDto,
  ChangeAssetOperationStatusDto,
  ChangeAssetReservationStatusDto,
  CreateAssetDisposalDto,
  CreateAssetIncidentDto,
  CreateAssetLocationDto,
  CreateAssetMaintenanceDto,
  CreateAssetOperationDto,
  CreateAssetReservationDto,
  RecordAssetInspectionDto,
  RecordAssetDeploymentDto,
  RecordAssetMovementDto,
  RecordAssetQrEventDto,
} from './dto/asset-operations.dto';

@ApiTags('asset-management')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('asset-management')
export class AssetManagementController {
  constructor(private readonly service: AssetManagementService) {}

  @Post('definitions')
  @ApiOperation({ summary: 'Create an immutable Asset Definition identity' })
  createDefinition(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetDefinitionDto,
  ) {
    return this.service.createDefinition(user.id, dto);
  }

  @Post('instances')
  @ApiOperation({ summary: 'Create a serialized Asset Instance identity' })
  createInstance(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetInstanceDto,
  ) {
    return this.service.createInstance(user.id, dto);
  }

  @Post('batches')
  createBatch(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetBatchDto,
  ) {
    return this.service.createBatch(user.id, dto);
  }

  @Post('kits')
  createKit(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetKitDto,
  ) {
    return this.service.createKit(user.id, dto);
  }

  @Patch('instances/:id/lifecycle')
  @ApiOperation({
    summary: 'Change lifecycle status with immutable audit evidence',
  })
  changeLifecycle(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: ChangeAssetLifecycleDto,
  ) {
    return this.service.changeLifecycle(user.id, id, dto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Permission-aware enterprise asset identity search',
  })
  search(
    @CurrentUser() user: UserResponseDto,
    @Query() query: AssetSearchQueryDto,
  ) {
    return this.service.search(user.id, query);
  }

  @Post('locations')
  createLocation(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetLocationDto,
  ) {
    return this.service.createLocation(user.id, dto);
  }

  @Post('movements')
  recordMovement(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: RecordAssetMovementDto,
  ) {
    return this.service.recordMovement(user.id, dto);
  }

  @Post('qr-events')
  recordQrEvent(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: RecordAssetQrEventDto,
  ) {
    return this.service.recordQrEvent(user.id, dto);
  }

  @Post('reservations')
  createReservation(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetReservationDto,
  ) {
    return this.service.createReservation(user.id, dto);
  }

  @Patch('reservations/:id/status')
  changeReservationStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: ChangeAssetReservationStatusDto,
  ) {
    return this.service.changeReservationStatus(user.id, id, dto);
  }

  @Post('operations')
  createOperation(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetOperationDto,
  ) {
    return this.service.createOperation(user.id, dto);
  }

  @Patch('operations/:id/status')
  changeOperationStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: ChangeAssetOperationStatusDto,
  ) {
    return this.service.changeOperationStatus(user.id, id, dto);
  }

  @Post('inspections')
  recordInspection(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: RecordAssetInspectionDto,
  ) {
    return this.service.recordInspection(user.id, dto);
  }

  @Post('deployments')
  recordDeployment(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: RecordAssetDeploymentDto,
  ) {
    return this.service.recordDeployment(user.id, dto);
  }

  @Post('maintenance')
  createMaintenance(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetMaintenanceDto,
  ) {
    return this.service.createMaintenance(user.id, dto);
  }

  @Patch('maintenance/:id/status')
  changeMaintenanceStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: ChangeAssetMaintenanceStatusDto,
  ) {
    return this.service.changeMaintenanceStatus(user.id, id, dto);
  }

  @Post('incidents')
  createIncident(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetIncidentDto,
  ) {
    return this.service.createIncident(user.id, dto);
  }

  @Post('disposals')
  createDisposal(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateAssetDisposalDto,
  ) {
    return this.service.createDisposal(user.id, dto);
  }

  @Patch('disposals/:id/status')
  changeDisposalStatus(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: ChangeAssetDisposalStatusDto,
  ) {
    return this.service.changeDisposalStatus(user.id, id, dto);
  }

  @Get('governance-summary')
  governanceSummary(
    @CurrentUser() user: UserResponseDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.service.governanceSummary(user.id, organizationId);
  }
}
