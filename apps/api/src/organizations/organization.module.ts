import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationSettingsController } from './organization-settings.controller';
import { OrganizationUsersController } from './organization-users.controller';
import { OrganizationService } from './organization.service';
import { OrganizationPrismaRepository } from './organization.prisma-repository';

@Module({
  controllers: [
    OrganizationController,
    OrganizationSettingsController,
    OrganizationUsersController,
  ],
  providers: [OrganizationService, OrganizationPrismaRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
