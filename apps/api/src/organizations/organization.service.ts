import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationPrismaRepository } from './organization.prisma-repository';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly repository: OrganizationPrismaRepository) {}

  async create(data: CreateOrganizationDto) {
    return this.repository.create(data);
  }

  async findAll(query?: FindOrganizationsQueryDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const organization = await this.repository.findById(id);

    if (!organization) {
      throw new NotFoundException(`Organization with id ${id} not found`);
    }

    return organization;
  }

  async findAccessibleById(userId: string, organizationId: string) {
    await this.ensureOrganizationAccess(userId, organizationId);
    return this.findOne(organizationId);
  }

  async updateSettings(
    userId: string,
    organizationId: string,
    data: UpdateOrganizationSettingsDto,
  ) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);

    return this.repository.updateSettings(organizationId, data);
  }

  async updateLogo(userId: string, organizationId: string, logoUrl: string) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);

    return this.repository.updateLogo(organizationId, logoUrl);
  }

  async update(id: string, data: UpdateOrganizationDto) {
    await this.findOne(id);

    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.repository.remove(id);
  }

  private async ensureOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.repository.findMembership(
      userId,
      organizationId,
    );

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }
}
