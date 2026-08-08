import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller';
import { RequirementImpactService } from './requirement-impact.service';
import { RequirementsService } from './requirements.service';

@Module({
  controllers: [RequirementsController],
  providers: [RequirementsService, RequirementImpactService],
})
export class RequirementsModule {}
