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
import { CreateProcurementPackageDto } from './dto/procurement.dto';
import { ProcurementService } from './procurement.service';

@ApiTags('procurement-studio')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('events/:eventId/procurement-packages')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a Requirement Group procurement package' })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Body() dto: CreateProcurementPackageDto,
  ) {
    return this.procurementService.createPackage(user.id, eventId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List procurement packages and solutions' })
  list(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
  ) {
    return this.procurementService.listPackages(user.id, eventId);
  }

  @Post(':packageId/analyse')
  @ApiOperation({
    summary: 'Generate multiple explainable Procurement Solutions',
  })
  analyse(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('packageId') packageId: string,
  ) {
    return this.procurementService.analyse(user.id, eventId, packageId);
  }

  @Post(':packageId/solutions/:solutionId/select')
  @ApiOperation({
    summary: 'Select a Procurement Solution without creating a commitment',
  })
  select(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('packageId') packageId: string,
    @Param('solutionId') solutionId: string,
  ) {
    return this.procurementService.selectSolution(
      user.id,
      eventId,
      packageId,
      solutionId,
    );
  }

  @Post(':packageId/request-quotations')
  @ApiOperation({ summary: 'Request M008 quotation generation; send nothing' })
  requestQuotations(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('packageId') packageId: string,
  ) {
    return this.procurementService.requestQuotations(
      user.id,
      eventId,
      packageId,
    );
  }
}
