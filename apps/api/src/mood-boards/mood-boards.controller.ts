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
import { CreateMoodBoardDto, MoodBoardReviewDto } from './dto/mood-board.dto';
import { PrepareMoodBoardRenderDto } from './dto/mood-board-render.dto';
import { MoodBoardsService } from './mood-boards.service';

@ApiTags('mood-boards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('events/:eventId/mood-boards')
export class MoodBoardsController {
  constructor(private readonly moodBoardsService: MoodBoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create Mood Board V1 or an immutable revision' })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Body() dto: CreateMoodBoardDto,
  ) {
    return this.moodBoardsService.create(user.id, eventId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List Mood Board versions, newest first' })
  list(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
  ) {
    return this.moodBoardsService.list(user.id, eventId);
  }

  @Post(':boardId/render-requests')
  @ApiOperation({
    summary: 'Prepare a provider-neutral AI scene render request',
  })
  prepareRender(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('boardId') boardId: string,
    @Body() dto: PrepareMoodBoardRenderDto,
  ) {
    return this.moodBoardsService.prepareRenderRequest(
      user.id,
      eventId,
      boardId,
      dto,
    );
  }

  @Get(':boardId/render-requests')
  @ApiOperation({
    summary: 'List prepared and historical AI scene render requests',
  })
  listRenderRequests(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.moodBoardsService.listRenderRequests(user.id, eventId, boardId);
  }

  @Post(':boardId/render-requests/:requestId/cancel')
  @ApiOperation({
    summary: 'Cancel a render request before provider submission',
  })
  cancelRenderRequest(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('boardId') boardId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.moodBoardsService.cancelRenderRequest(
      user.id,
      eventId,
      boardId,
      requestId,
    );
  }

  @Post(':boardId/submit-review')
  @ApiOperation({ summary: 'Submit a Mood Board for client review' })
  submitReview(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.moodBoardsService.submitForReview(user.id, eventId, boardId);
  }

  @Post(':boardId/comments')
  @ApiOperation({ summary: 'Add an immutable client review comment' })
  comment(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('boardId') boardId: string,
    @Body() dto: MoodBoardReviewDto,
  ) {
    return this.moodBoardsService.comment(user.id, eventId, boardId, dto);
  }

  @Post(':boardId/request-changes')
  @ApiOperation({ summary: 'Request changes before a new version is created' })
  requestChanges(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('boardId') boardId: string,
    @Body() dto: MoodBoardReviewDto,
  ) {
    return this.moodBoardsService.requestChanges(
      user.id,
      eventId,
      boardId,
      dto,
    );
  }

  @Post(':boardId/approve')
  @ApiOperation({
    summary: 'Approve the visual design without starting procurement',
  })
  approve(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.moodBoardsService.approve(user.id, eventId, boardId);
  }

  @Get(':fromBoardId/compare/:toBoardId')
  @ApiOperation({ summary: 'Compare versions and identify requirement impact' })
  compare(
    @CurrentUser() user: UserResponseDto,
    @Param('eventId') eventId: string,
    @Param('fromBoardId') fromBoardId: string,
    @Param('toBoardId') toBoardId: string,
  ) {
    return this.moodBoardsService.compare(
      user.id,
      eventId,
      fromBoardId,
      toBoardId,
    );
  }
}
