import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  tradingName: string | null;
  vatNumber: string | null;
  registrationNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationQuery = {
  page?: number;
  limit?: number;
  name?: string;
};

type MembershipRecord = {
  id: string;
  userId: string;
  organizationId: string;
};

type OrganizationClient = {
  organization: {
    create: (args: {
      data: CreateOrganizationDto;
    }) => Promise<OrganizationRecord>;
    findMany: (args: {
      where?: {
        name?: {
          contains: string;
          mode: 'insensitive';
        };
      };
      orderBy: { createdAt: 'desc' };
      skip: number;
      take: number;
    }) => Promise<OrganizationRecord[]>;
    count: (args: {
      where?: {
        name?: {
          contains: string;
          mode: 'insensitive';
        };
      };
    }) => Promise<number>;
    findUnique: (args: {
      where: { id: string };
    }) => Promise<OrganizationRecord | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, string | undefined>;
    }) => Promise<OrganizationRecord>;
    delete: (args: { where: { id: string } }) => Promise<OrganizationRecord>;
  };
  membership: {
    findUnique: (args: {
      where: {
        userId_organizationId: {
          userId: string;
          organizationId: string;
        };
      };
    }) => Promise<MembershipRecord | null>;
  };
  $transaction: <T extends readonly unknown[]>(queries: {
    [K in keyof T]: Promise<T[K]>;
  }) => Promise<T>;
};

@Injectable()
export class OrganizationPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma as unknown as OrganizationClient;
  }

  create(data: CreateOrganizationDto) {
    return this.client.organization.create({ data });
  }

  async findAll(query?: OrganizationQuery) {
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

    const [data, total] = await this.client.$transaction([
      this.client.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.client.organization.count({ where }),
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
    return this.client.organization.findUnique({ where: { id } });
  }

  findMembership(userId: string, organizationId: string) {
    return this.client.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  updateSettings(id: string, data: UpdateOrganizationSettingsDto) {
    return this.client.organization.update({
      where: { id },
      data: {
        name: data.companyName,
        tradingName: data.tradingName,
        vatNumber: data.vatNumber,
        registrationNumber: data.registrationNumber,
        email: data.email,
        phone: data.phone,
        website: data.website,
        physicalAddress: data.physicalAddress,
        postalAddress: data.postalAddress,
      },
    });
  }

  updateLogo(id: string, logoUrl: string) {
    return this.client.organization.update({
      where: { id },
      data: {
        logoUrl,
      },
    });
  }

  update(id: string, data: UpdateOrganizationDto) {
    return this.client.organization.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }

  remove(id: string) {
    return this.client.organization.delete({ where: { id } });
  }
}
