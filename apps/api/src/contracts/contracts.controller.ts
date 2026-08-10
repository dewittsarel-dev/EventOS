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
import { ContractsService } from './contracts.service';
import {
  CreateContractTemplateDto,
  GenerateCommercialAgreementDto,
} from './dto/contracts.dto';

@ApiTags('contracts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller()
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Post('organizations/:organizationId/contract-templates')
  @ApiOperation({ summary: 'Create a private reusable contract template' })
  createTemplate(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateContractTemplateDto,
  ) {
    return this.service.createTemplate(user.id, organizationId, dto);
  }

  @Get('organizations/:organizationId/contract-templates')
  @ApiOperation({ summary: 'List private contract templates' })
  listTemplates(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
  ) {
    return this.service.listTemplates(user.id, organizationId);
  }

  @Post('organizations/:organizationId/contract-templates/:templateId/approve')
  @ApiOperation({ summary: 'Human approval of reusable legal wording' })
  approveTemplate(
    @CurrentUser() user: UserResponseDto,
    @Param('organizationId') organizationId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.service.approveTemplate(user.id, organizationId, templateId);
  }

  @Post('events/:eventId/commercial-workspaces/:workspaceId/agreements')
  @ApiOperation({ summary: 'Prepare an event agreement from approved records' })
  generateAgreement(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: GenerateCommercialAgreementDto,
  ) {
    return this.service.generateAgreement(user.id, eventId, workspaceId, dto);
  }

  @Get('events/:eventId/commercial-workspaces/:workspaceId/agreements')
  @ApiOperation({ summary: 'List governed agreements for this conversation' })
  listAgreements(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.service.listAgreements(user.id, eventId, workspaceId);
  }

  @Post(
    'events/:eventId/commercial-workspaces/:workspaceId/agreements/:agreementId/approve',
  )
  @ApiOperation({ summary: 'Human approval of an event-specific agreement' })
  approveAgreement(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('agreementId') agreementId: string,
  ) {
    return this.service.approveAgreement(
      user.id,
      eventId,
      workspaceId,
      agreementId,
    );
  }
}
