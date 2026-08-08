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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommercialWorkspacesService } from './commercial-workspaces.service';
import {
  CreateCommercialMessageDto,
  GenerateCommercialWorkspaceDto,
  ReviseCommercialRfqDto,
} from './dto/commercial-workspace.dto';

@ApiTags('commercial-workspaces')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('events/:eventId/commercial-workspaces')
export class CommercialWorkspacesController {
  constructor(private readonly service: CommercialWorkspacesService) {}

  @Post('from-procurement-package/:packageId')
  @ApiOperation({ summary: 'Generate structured RFQ drafts; send nothing' })
  generate(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('packageId') packageId: string,
    @Body() dto: GenerateCommercialWorkspaceDto,
  ) {
    return this.service.generate(user.id, eventId, packageId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List complete commercial conversations' })
  list(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
  ) {
    return this.service.list(user.id, eventId);
  }

  @Patch(':workspaceId/rfqs/:rfqId')
  @ApiOperation({ summary: 'Revise a draft RFQ with audit snapshot' })
  reviseRfq(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('rfqId') rfqId: string,
    @Body() dto: ReviseCommercialRfqDto,
  ) {
    return this.service.reviseRfq(user.id, eventId, workspaceId, rfqId, dto);
  }

  @Post(':workspaceId/rfqs/:rfqId/approve')
  @ApiOperation({ summary: 'Approve a reviewed RFQ without sending it' })
  approveRfq(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('rfqId') rfqId: string,
  ) {
    return this.service.approveRfq(user.id, eventId, workspaceId, rfqId);
  }

  @Post(':workspaceId/rfqs/:rfqId/send')
  @ApiOperation({
    summary: 'Deliver an approved structured RFQ to Supplier Workspace',
  })
  sendRfq(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('rfqId') rfqId: string,
  ) {
    return this.service.sendRfq(user.id, eventId, workspaceId, rfqId);
  }

  @Post(':workspaceId/messages')
  @ApiOperation({ summary: 'Add planner discussion or an unsent AI draft' })
  addMessage(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCommercialMessageDto,
  ) {
    return this.service.addMessage(user.id, eventId, workspaceId, dto);
  }
}
