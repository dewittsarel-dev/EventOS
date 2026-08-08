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
