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
  CreateCommercialAwardsDto,
  GenerateCommercialWorkspaceDto,
  ReviseCommercialRfqDto,
  ReviewCommercialSubstitutionDto,
  SubmitCommercialQuoteDto,
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

  @Post(':workspaceId/rfqs/:rfqId/quotes')
  @ApiOperation({ summary: 'Submit an immutable supplier quote revision' })
  submitQuote(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('rfqId') rfqId: string,
    @Body() dto: SubmitCommercialQuoteDto,
  ) {
    return this.service.submitQuote(user.id, eventId, workspaceId, rfqId, dto);
  }

  @Get(':workspaceId/comparison')
  @ApiOperation({
    summary:
      'Compare current quotes by Requirement Item with explainable solution options',
  })
  compareQuotes(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.service.compareQuotes(user.id, eventId, workspaceId);
  }

  @Post(':workspaceId/substitutions/:impactId/review')
  @ApiOperation({
    summary: 'Approve or reject a cross-module substitution impact',
  })
  reviewSubstitution(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('impactId') impactId: string,
    @Body() dto: ReviewCommercialSubstitutionDto,
  ) {
    return this.service.reviewSubstitution(
      user.id,
      eventId,
      workspaceId,
      impactId,
      dto,
    );
  }

  @Post(':workspaceId/awards')
  @ApiOperation({ summary: 'Award a package or individual Requirement Items' })
  award(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCommercialAwardsDto,
  ) {
    return this.service.award(user.id, eventId, workspaceId, dto);
  }

  @Post(':workspaceId/purchase-order-drafts')
  @ApiOperation({
    summary: 'Prepare supplier Purchase Order drafts from approved awards',
  })
  preparePurchaseOrderDrafts(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.service.preparePurchaseOrderDrafts(
      user.id,
      eventId,
      workspaceId,
    );
  }

  @Post(':workspaceId/purchase-order-drafts/:draftId/approve')
  @ApiOperation({
    summary: 'Planner approves a prepared Purchase Order draft without sending',
  })
  approvePurchaseOrderDraft(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
  ) {
    return this.service.approvePurchaseOrderDraft(
      user.id,
      eventId,
      workspaceId,
      draftId,
    );
  }
}
