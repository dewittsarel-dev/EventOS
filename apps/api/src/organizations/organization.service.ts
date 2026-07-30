import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationPrismaRepository } from './organization.prisma-repository';

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

  async update(id: string, data: UpdateOrganizationDto) {
    await this.findOne(id);

    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.repository.remove(id);
  }
}
