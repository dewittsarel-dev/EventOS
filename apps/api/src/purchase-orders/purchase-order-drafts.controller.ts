import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePurchaseOrderDraftDto,
  UpdatePurchaseOrderDraftReviewDto,
} from './dto/purchase-order-draft.dto';
import { PurchaseOrderDraftsService } from './purchase-order-drafts.service';

type UploadedSourceFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@ApiTags('purchase-order-drafts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders/drafts')
export class PurchaseOrderDraftsController {
  constructor(
    private readonly purchaseOrderDraftsService: PurchaseOrderDraftsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('sourceFile'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiConsumes('multipart/form-data')
  create(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreatePurchaseOrderDraftDto,
    @UploadedFile() file?: UploadedSourceFile,
  ) {
    return this.purchaseOrderDraftsService.createFromSource(user.id, dto, file);
  }

  @Post('ai-upload')
  @UseInterceptors(FileInterceptor('sourceFile'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiConsumes('multipart/form-data')
  createAiUploadDraft(
    @CurrentUser() user: UserResponseDto,
    @Query('organizationId') organizationId: string,
    @UploadedFile() file?: UploadedSourceFile,
  ) {
    return this.purchaseOrderDraftsService.createAiUploadDraft(
      user.id,
      organizationId,
      file,
    );
  }

  @Get('ai-upload/:id')
  findAiUploadDraft(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
  ) {
    return this.purchaseOrderDraftsService.findAiUploadDraft(user.id, id);
  }

  @Get('ai-upload/:id/documents/:documentId/content')
  async streamAiUploadDraftDocument(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true })
    response: { setHeader(name: string, value: string): void },
  ) {
    const document =
      await this.purchaseOrderDraftsService.getAiUploadDraftDocument(
        user.id,
        id,
        documentId,
      );

    const safeName = document.fileName.replace(/"/g, '');
    response.setHeader('Content-Type', document.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

    return new StreamableFile(document.bytes);
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrderDraftsService.findOne(user.id, id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateReview(
    @CurrentUser() user: UserResponseDto,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDraftReviewDto,
  ) {
    return this.purchaseOrderDraftsService.updateReview(user.id, id, dto);
  }

  @Post(':id/commit')
  commit(@CurrentUser() user: UserResponseDto, @Param('id') id: string) {
    return this.purchaseOrderDraftsService.commit(user.id, id);
  }
}
