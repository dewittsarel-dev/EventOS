import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationSettingsController } from './organization-settings.controller';
import { OrganizationUsersController } from './organization-users.controller';
import { RolesController } from './roles.controller';
import { OrganizationService } from './organization.service';
import { OrganizationPrismaRepository } from './organization.prisma-repository';

@Module({
  controllers: [
    OrganizationController,
    OrganizationSettingsController,
    OrganizationUsersController,
    RolesController,
  ],
  providers: [OrganizationService, OrganizationPrismaRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
