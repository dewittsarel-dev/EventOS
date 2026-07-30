import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationSettingsController } from './organization-settings.controller';
import { OrganizationService } from './organization.service';
import { OrganizationPrismaRepository } from './organization.prisma-repository';

@Module({
  controllers: [OrganizationController, OrganizationSettingsController],
  providers: [OrganizationService, OrganizationPrismaRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
