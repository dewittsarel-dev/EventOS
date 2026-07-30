import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { InviteOrganizationUserDto } from './dto/invite-organization-user.dto';
import {
  defaultRolePermissions,
  ROLE_PERMISSION_ACTIONS,
  ROLE_PERMISSION_GROUPS,
  RolePermissionAction,
  RolePermissionGroup,
  RolePermissionSet,
} from './dto/permission-groups';
import { OrganizationUserRole } from './dto/organization-user-role';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationPrismaRepository } from './organization.prisma-repository';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

type RoleRecord = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  permissions: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SystemRoleSeed = {
  name: OrganizationUserRole;
  description: string;
  permissions: RolePermissionSet;
};

const SYSTEM_ROLE_SEEDS: SystemRoleSeed[] = [
  {
    name: 'Administrator',
    description: 'Full access across all ClientOS modules and settings.',
    permissions: permissionPreset('all'),
  },
  {
    name: 'Manager',
    description:
      'Operational management access for planning, execution, and approvals.',
    permissions: permissionPreset('manager'),
  },
  {
    name: 'Staff',
    description: 'Execution-focused access for day-to-day task delivery.',
    permissions: permissionPreset('staff'),
  },
];

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

  async listRoles(userId: string, organizationId: string) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);

    const roles = await this.ensureSystemRoles(organizationId);
    const counts = await this.repository.countMembershipsByRoleNames(
      organizationId,
      roles.map((role) => role.name),
    );

    return {
      data: roles.map((role) =>
        this.toRoleResponse(role, counts.get(role.name) ?? 0),
      ),
    };
  }

  async findRoleById(userId: string, organizationId: string, roleId: string) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);
    await this.ensureSystemRoles(organizationId);

    const role = await this.repository.findRoleById(roleId);

    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundException('Role not found');
    }

    const counts = await this.repository.countMembershipsByRoleNames(
      organizationId,
      [role.name],
    );

    return this.toRoleResponse(role, counts.get(role.name) ?? 0);
  }

  async createRole(userId: string, organizationId: string, dto: CreateRoleDto) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);
    await this.ensureSystemRoles(organizationId);

    const normalizedName = this.normalizeRoleName(dto.name);
    const duplicate = await this.repository.findRoleByName(
      organizationId,
      normalizedName,
    );

    if (duplicate) {
      throw new BadRequestException('A role with this name already exists');
    }

    const normalizedPermissions = this.normalizePermissionSet(dto.permissions);
    const created = await this.repository.createRole(
      organizationId,
      {
        ...dto,
        name: normalizedName,
      },
      JSON.stringify(normalizedPermissions),
    );

    return this.toRoleResponse(created, 0);
  }

  async updateRole(
    userId: string,
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);
    await this.ensureSystemRoles(organizationId);

    const existing = await this.repository.findRoleById(roleId);

    if (!existing || existing.organizationId !== organizationId) {
      throw new NotFoundException('Role not found');
    }

    const normalizedName = this.normalizeRoleName(dto.name);
    const duplicate = await this.repository.findRoleByName(
      organizationId,
      normalizedName,
      roleId,
    );

    if (duplicate) {
      throw new BadRequestException('A role with this name already exists');
    }

    const normalizedPermissions = this.normalizePermissionSet(dto.permissions);
    const updated = await this.repository.updateRole(
      roleId,
      {
        ...dto,
        name: normalizedName,
      },
      JSON.stringify(normalizedPermissions),
    );

    const counts = await this.repository.countMembershipsByRoleNames(
      organizationId,
      [updated.name],
    );

    return this.toRoleResponse(updated, counts.get(updated.name) ?? 0);
  }

  async deleteRole(userId: string, organizationId: string, roleId: string) {
    await this.ensureOrganizationAccess(userId, organizationId);
    await this.findOne(organizationId);
    await this.ensureSystemRoles(organizationId);

    const existing = await this.repository.findRoleById(roleId);

    if (!existing || existing.organizationId !== organizationId) {
      throw new NotFoundException('Role not found');
    }

    if (existing.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    await this.repository.deleteRole(roleId);
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

  private normalizeRoleName(name: string) {
    const value = name.trim();

    if (!value) {
      throw new BadRequestException('Role name is required');
    }

    return value;
  }

  private normalizePermissionSet(raw: Record<string, Record<string, boolean>>) {
    const normalized = defaultRolePermissions();

    for (const group of ROLE_PERMISSION_GROUPS) {
      const sourceGroup = raw[group];

      if (!sourceGroup || typeof sourceGroup !== 'object') {
        continue;
      }

      for (const action of ROLE_PERMISSION_ACTIONS) {
        normalized[group][action] = Boolean(sourceGroup[action]);
      }
    }

    return normalized;
  }

  private parsePermissionSet(raw: string): RolePermissionSet {
    try {
      const parsed = JSON.parse(raw) as Record<string, Record<string, boolean>>;
      return this.normalizePermissionSet(parsed);
    } catch {
      return defaultRolePermissions();
    }
  }

  private async ensureSystemRoles(organizationId: string) {
    const existing = await this.repository.listRoles(organizationId);
    const existingNames = new Set(existing.map((role) => role.name));

    for (const seed of SYSTEM_ROLE_SEEDS) {
      if (existingNames.has(seed.name)) {
        continue;
      }

      await this.repository.createSystemRole(
        organizationId,
        seed.name,
        seed.description,
        JSON.stringify(seed.permissions),
      );
    }

    return this.repository.listRoles(organizationId);
  }

  private toRoleResponse(role: RoleRecord, userCount: number) {
    return {
      id: role.id,
      organizationId: role.organizationId,
      name: role.name,
      description: role.description,
      userCount,
      isSystem: role.isSystem,
      permissions: this.parsePermissionSet(role.permissions),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
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

function permissionPreset(type: 'all' | 'manager' | 'staff') {
  const map = defaultRolePermissions();

  for (const group of ROLE_PERMISSION_GROUPS) {
    for (const action of ROLE_PERMISSION_ACTIONS) {
      map[group][action] = false;
    }
  }

  if (type === 'all') {
    for (const group of ROLE_PERMISSION_GROUPS) {
      for (const action of ROLE_PERMISSION_ACTIONS) {
        map[group][action] = true;
      }
    }

    return map;
  }

  if (type === 'manager') {
    for (const group of ROLE_PERMISSION_GROUPS) {
      map[group].View = true;
      map[group].Create = true;
      map[group].Edit = true;
      map[group].Delete = group === 'Tasks' || group === 'Calendar';
    }

    map.Settings.Delete = false;
    map.Roles.Delete = false;
    return map;
  }

  for (const group of ROLE_PERMISSION_GROUPS) {
    map[group].View = true;
    map[group].Create = group === 'Tasks' || group === 'Calendar';
    map[group].Edit = group === 'Tasks' || group === 'Calendar';
    map[group].Delete = false;
  }

  map.Users.View = false;
  map.Roles.View = false;
  map.Settings.View = false;

  return map;
}
