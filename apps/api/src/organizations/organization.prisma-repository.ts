import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { InviteOrganizationUserDto } from './dto/invite-organization-user.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';

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
  role: string;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: UserRecord;
};

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
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
      data: Record<string, string | null | undefined>;
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
    findMany: (args: {
      where: { organizationId: string };
      include: { user: true };
      orderBy: { createdAt: 'asc' };
    }) => Promise<MembershipRecord[]>;
    create: (args: {
      data: {
        userId: string;
        organizationId: string;
        role: string;
      };
      include: { user: true };
    }) => Promise<MembershipRecord>;
    update: (args: {
      where: {
        userId_organizationId: {
          userId: string;
          organizationId: string;
        };
      };
      data: {
        role?: string;
        isDisabled?: boolean;
      };
      include: { user: true };
    }) => Promise<MembershipRecord>;
    delete: (args: {
      where: {
        userId_organizationId: {
          userId: string;
          organizationId: string;
        };
      };
    }) => Promise<MembershipRecord>;
  };
  user: {
    findUnique: (args: {
      where: {
        id?: string;
        email?: string;
      };
    }) => Promise<UserRecord | null>;
    create: (args: {
      data: {
        email: string;
        name?: string | null;
      };
    }) => Promise<UserRecord>;
    update: (args: {
      where: { id: string };
      data: {
        email?: string;
        name?: string | null;
      };
    }) => Promise<UserRecord>;
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

  listOrganizationUsers(organizationId: string) {
    return this.client.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOrganizationUserMembership(organizationId: string, userId: string) {
    return this.client.membership.findUnique({
      where: {
        userId_organizationId: {
          organizationId,
          userId,
        },
      },
    });
  }

  findUserByEmail(email: string) {
    return this.client.user.findUnique({
      where: { email },
    });
  }

  findUserById(userId: string) {
    return this.client.user.findUnique({
      where: { id: userId },
    });
  }

  createUser(data: InviteOrganizationUserDto) {
    return this.client.user.create({
      data: {
        email: data.email,
        name: data.name?.trim() || null,
      },
    });
  }

  updateUser(userId: string, data: UpdateOrganizationUserDto) {
    return this.client.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        name: data.name?.trim() || null,
      },
    });
  }

  createMembership(organizationId: string, userId: string, role: string) {
    return this.client.membership.create({
      data: {
        organizationId,
        userId,
        role,
      },
      include: { user: true },
    });
  }

  updateMembership(
    organizationId: string,
    userId: string,
    data: {
      role?: string;
      isDisabled?: boolean;
    },
  ) {
    return this.client.membership.update({
      where: {
        userId_organizationId: {
          organizationId,
          userId,
        },
      },
      data,
      include: { user: true },
    });
  }

  removeMembership(organizationId: string, userId: string) {
    return this.client.membership.delete({
      where: {
        userId_organizationId: {
          organizationId,
          userId,
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
