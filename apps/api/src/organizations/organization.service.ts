import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { InviteOrganizationUserDto } from './dto/invite-organization-user.dto';
import { OrganizationUserRole } from './dto/organization-user-role';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationPrismaRepository } from './organization.prisma-repository';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';

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

  async listOrganizationUsers(userId: string, organizationId: string) {
    await this.ensureOrganizationAccess(userId, organizationId);

    const memberships =
      await this.repository.listOrganizationUsers(organizationId);

    return {
      data: memberships.map((membership) =>
        this.toOrganizationUser(membership),
      ),
    };
  }

  async inviteOrganizationUser(
    userId: string,
    organizationId: string,
    data: InviteOrganizationUserDto,
  ) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);

    const normalizedEmail = this.normalizeEmail(data.email);
    const normalizedRole = this.normalizeRole(data.role);
    const existingUser = await this.repository.findUserByEmail(normalizedEmail);

    if (!existingUser) {
      const createdUser = await this.repository.createUser({
        ...data,
        email: normalizedEmail,
      });

      const membership = await this.repository.createMembership(
        organizationId,
        createdUser.id,
        normalizedRole,
      );

      return this.toOrganizationUser(membership);
    }

    const existingMembership =
      await this.repository.findOrganizationUserMembership(
        organizationId,
        existingUser.id,
      );

    if (existingMembership) {
      await this.repository.updateUser(existingUser.id, {
        email: normalizedEmail,
        name: data.name,
        role: normalizedRole,
      });

      const membership = await this.repository.updateMembership(
        organizationId,
        existingUser.id,
        {
          role: normalizedRole,
          isDisabled: false,
        },
      );

      return this.toOrganizationUser(membership);
    }

    await this.repository.updateUser(existingUser.id, {
      email: normalizedEmail,
      name: data.name,
      role: normalizedRole,
    });

    const membership = await this.repository.createMembership(
      organizationId,
      existingUser.id,
      normalizedRole,
    );

    return this.toOrganizationUser(membership);
  }

  async updateOrganizationUser(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
    data: UpdateOrganizationUserDto,
  ) {
    await this.ensureOrganizationAccess(actorUserId, organizationId);
    await this.findOne(organizationId);

    const existingMembership =
      await this.repository.findOrganizationUserMembership(
        organizationId,
        targetUserId,
      );

    if (!existingMembership) {
      throw new NotFoundException('Organization membership not found');
    }

    const user = await this.repository.findUserById(targetUserId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedEmail = this.normalizeEmail(data.email);
    const conflictingUser =
      await this.repository.findUserByEmail(normalizedEmail);

    if (conflictingUser && conflictingUser.id !== user.id) {
      throw new BadRequestException('Email is already in use by another user');
    }

    await this.repository.updateUser(targetUserId, {
      ...data,
      email: normalizedEmail,
      role: this.normalizeRole(data.role),
    });

    const membership = await this.repository.updateMembership(
      organizationId,
      targetUserId,
      {
        role: this.normalizeRole(data.role),
      },
    );

    return this.toOrganizationUser(membership);
  }

  async setOrganizationUserDisabled(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
    disabled: boolean,
  ) {
    await this.ensureOrganizationAccess(actorUserId, organizationId);
    await this.findOne(organizationId);

    const existingMembership =
      await this.repository.findOrganizationUserMembership(
        organizationId,
        targetUserId,
      );

    if (!existingMembership) {
      throw new NotFoundException('Organization membership not found');
    }

    const membership = await this.repository.updateMembership(
      organizationId,
      targetUserId,
      {
        isDisabled: disabled,
      },
    );

    return this.toOrganizationUser(membership);
  }

  async deleteOrganizationUser(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
  ) {
    await this.ensureOrganizationAccess(actorUserId, organizationId);
    await this.findOne(organizationId);

    const existingMembership =
      await this.repository.findOrganizationUserMembership(
        organizationId,
        targetUserId,
      );

    if (!existingMembership) {
      throw new NotFoundException('Organization membership not found');
    }

    await this.repository.removeMembership(organizationId, targetUserId);
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

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeRole(role: string): OrganizationUserRole {
    if (role === 'Administrator' || role === 'Manager' || role === 'Staff') {
      return role;
    }

    throw new BadRequestException('Invalid role value');
  }

  private toOrganizationUser(membership: {
    id: string;
    userId: string;
    role: string;
    isDisabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      email: string;
      name: string | null;
    };
  }) {
    return {
      membershipId: membership.id,
      userId: membership.userId,
      name: membership.user?.name ?? null,
      email: membership.user?.email ?? '',
      role: this.normalizeRole(membership.role),
      status: membership.isDisabled ? 'Disabled' : 'Active',
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
