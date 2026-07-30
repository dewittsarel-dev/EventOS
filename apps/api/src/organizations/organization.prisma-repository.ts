import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOrganizationDto) {
    return this.prisma.organization.create({ data });
  }

  async findAll(query?: FindOrganizationsQueryDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const where = query?.name
      ? {
          name: {
            contains: query.name,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  findById(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateOrganizationDto) {
    return this.prisma.organization.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }
}
