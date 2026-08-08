import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiDraftsService } from './ai-drafts.service';

@Module({
  imports: [PrismaModule],
  providers: [AiDraftsService],
  exports: [AiDraftsService],
})
export class AiDraftsModule {}
