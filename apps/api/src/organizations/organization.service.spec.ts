import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { OrganizationPrismaRepository } from './organization.prisma-repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { InviteOrganizationUserDto } from './dto/invite-organization-user.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    findMembership: jest.Mock;
    listOrganizationUsers: jest.Mock;
    findOrganizationUserMembership: jest.Mock;
    findUserByEmail: jest.Mock;
    findUserById: jest.Mock;
    createUser: jest.Mock;
    updateUser: jest.Mock;
    createMembership: jest.Mock;
    updateMembership: jest.Mock;
    removeMembership: jest.Mock;
    updateSettings: jest.Mock;
    updateLogo: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findMembership: jest.fn(),
      listOrganizationUsers: jest.fn(),
      findOrganizationUserMembership: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      createMembership: jest.fn(),
      updateMembership: jest.fn(),
      removeMembership: jest.fn(),
      updateSettings: jest.fn(),
      updateLogo: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: OrganizationPrismaRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('creates an organization', async () => {
    const payload: CreateOrganizationDto = { name: 'EventOS', slug: 'eventos' };
    const created = {
      id: 'org-1',
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repository.create.mockResolvedValue(created);

    await expect(service.create(payload)).resolves.toEqual(created);
    expect(repository.create).toHaveBeenCalledWith(payload);
  });

  it('lists organizations with pagination and name filtering', async () => {
    const query: FindOrganizationsQueryDto = {
      page: 2,
      limit: 5,
      name: 'Event',
    };
    const result = {
      data: [{ id: 'org-1', name: 'EventOS', slug: 'eventos' }],
      meta: { page: 2, limit: 5, total: 1 },
    };

    repository.findAll.mockResolvedValue(result);

    await expect(service.findAll(query)).resolves.toEqual(result);
    expect(repository.findAll).toHaveBeenCalledWith(query);
  });

  it('updates an organization', async () => {
    const payload: UpdateOrganizationDto = { name: 'Updated Org' };
    const updated = {
      id: 'org-1',
      name: 'Updated Org',
      slug: 'eventos',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
    repository.update.mockResolvedValue(updated);

    await expect(service.update('org-1', payload)).resolves.toEqual(updated);
    expect(repository.update).toHaveBeenCalledWith('org-1', payload);
  });

  it('gets an accessible organization by id', async () => {
    repository.findMembership.mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      organizationId: 'org-1',
    });
    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });

    await expect(
      service.findAccessibleById('user-1', 'org-1'),
    ).resolves.toEqual({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
  });

  it('updates organization settings with access validation', async () => {
    const payload: UpdateOrganizationSettingsDto = {
      companyName: 'EventOS Pty Ltd',
      email: 'ops@eventos.example',
    };

    repository.findMembership.mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      organizationId: 'org-1',
    });
    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
    repository.updateSettings.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS Pty Ltd',
      email: 'ops@eventos.example',
    });

    await expect(
      service.updateSettings('user-1', 'org-1', payload),
    ).resolves.toEqual({
      id: 'org-1',
      name: 'EventOS Pty Ltd',
      email: 'ops@eventos.example',
    });
  });

  it('updates organization logo with access validation', async () => {
    repository.findMembership.mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      organizationId: 'org-1',
    });
    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
    repository.updateLogo.mockResolvedValue({
      id: 'org-1',
      logoUrl: 'https://cdn.example.com/logo.png',
    });

    await expect(
      service.updateLogo('user-1', 'org-1', 'https://cdn.example.com/logo.png'),
    ).resolves.toEqual({
      id: 'org-1',
      logoUrl: 'https://cdn.example.com/logo.png',
    });
  });

  it('lists organization users mapped to role and status labels', async () => {
    repository.findMembership.mockResolvedValue({
      id: 'membership-actor',
      userId: 'actor-1',
      organizationId: 'org-1',
    });
    repository.listOrganizationUsers.mockResolvedValue([
      {
        id: 'membership-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'Manager',
        isDisabled: false,
        createdAt: new Date('2026-07-30T00:00:00.000Z'),
        updatedAt: new Date('2026-07-30T00:00:00.000Z'),
        user: {
          id: 'user-1',
          email: 'manager@example.com',
          name: 'Manager User',
        },
      },
    ]);

    await expect(
      service.listOrganizationUsers('actor-1', 'org-1'),
    ).resolves.toEqual({
      data: [
        expect.objectContaining({
          membershipId: 'membership-1',
          userId: 'user-1',
          name: 'Manager User',
          email: 'manager@example.com',
          role: 'Manager',
          status: 'Active',
        }),
      ],
    });
  });

  it('invites a brand-new user and creates membership', async () => {
    const payload: InviteOrganizationUserDto = {
      name: 'Avery Stone',
      email: 'AVERY@EXAMPLE.COM',
      role: 'Staff',
    };

    repository.findMembership.mockResolvedValue({
      id: 'membership-actor',
      userId: 'actor-1',
      organizationId: 'org-1',
    });
    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createUser.mockResolvedValue({
      id: 'user-2',
      email: 'avery@example.com',
      name: 'Avery Stone',
    });
    repository.createMembership.mockResolvedValue({
      id: 'membership-2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'Staff',
      isDisabled: false,
      createdAt: new Date('2026-07-30T00:00:00.000Z'),
      updatedAt: new Date('2026-07-30T00:00:00.000Z'),
      user: {
        id: 'user-2',
        email: 'avery@example.com',
        name: 'Avery Stone',
      },
    });

    await expect(
      service.inviteOrganizationUser('actor-1', 'org-1', payload),
    ).resolves.toEqual(
      expect.objectContaining({
        userId: 'user-2',
        role: 'Staff',
        status: 'Active',
      }),
    );

    expect(repository.findUserByEmail).toHaveBeenCalledWith(
      'avery@example.com',
    );
    expect(repository.createMembership).toHaveBeenCalledWith(
      'org-1',
      'user-2',
      'Staff',
    );
  });

  it('updates organization user details and role', async () => {
    const payload: UpdateOrganizationUserDto = {
      name: 'Updated User',
      email: 'updated@example.com',
      role: 'Administrator',
    };

    repository.findMembership.mockResolvedValue({
      id: 'membership-actor',
      userId: 'actor-1',
      organizationId: 'org-1',
    });
    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
    repository.findOrganizationUserMembership.mockResolvedValue({
      id: 'membership-target',
      userId: 'target-1',
      organizationId: 'org-1',
      role: 'Staff',
      isDisabled: false,
    });
    repository.findUserById.mockResolvedValue({
      id: 'target-1',
      email: 'old@example.com',
      name: 'Old User',
    });
    repository.findUserByEmail.mockResolvedValue({
      id: 'target-1',
      email: 'updated@example.com',
      name: 'Updated User',
    });
    repository.updateMembership.mockResolvedValue({
      id: 'membership-target',
      userId: 'target-1',
      organizationId: 'org-1',
      role: 'Administrator',
      isDisabled: false,
      createdAt: new Date('2026-07-30T00:00:00.000Z'),
      updatedAt: new Date('2026-07-30T00:00:00.000Z'),
      user: {
        id: 'target-1',
        email: 'updated@example.com',
        name: 'Updated User',
      },
    });

    await expect(
      service.updateOrganizationUser('actor-1', 'org-1', 'target-1', payload),
    ).resolves.toEqual(
      expect.objectContaining({
        userId: 'target-1',
        role: 'Administrator',
        email: 'updated@example.com',
      }),
    );
  });

  it('disables an organization user membership', async () => {
    repository.findMembership.mockResolvedValue({
      id: 'membership-actor',
      userId: 'actor-1',
      organizationId: 'org-1',
    });
    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
    repository.findOrganizationUserMembership.mockResolvedValue({
      id: 'membership-target',
      userId: 'target-1',
      organizationId: 'org-1',
      role: 'Staff',
      isDisabled: false,
    });
    repository.updateMembership.mockResolvedValue({
      id: 'membership-target',
      userId: 'target-1',
      organizationId: 'org-1',
      role: 'Staff',
      isDisabled: true,
      createdAt: new Date('2026-07-30T00:00:00.000Z'),
      updatedAt: new Date('2026-07-30T00:00:00.000Z'),
      user: {
        id: 'target-1',
        email: 'staff@example.com',
        name: 'Staff Member',
      },
    });

    await expect(
      service.setOrganizationUserDisabled('actor-1', 'org-1', 'target-1', true),
    ).resolves.toEqual(
      expect.objectContaining({
        userId: 'target-1',
        status: 'Disabled',
      }),
    );
  });

  it('deletes an organization user membership', async () => {
    repository.findMembership.mockResolvedValue({
      id: 'membership-actor',
      userId: 'actor-1',
      organizationId: 'org-1',
    });
    repository.findById.mockResolvedValue({
      id: 'org-1',
      name: 'EventOS',
      slug: 'eventos',
    });
    repository.findOrganizationUserMembership.mockResolvedValue({
      id: 'membership-target',
      userId: 'target-1',
      organizationId: 'org-1',
      role: 'Staff',
      isDisabled: false,
    });
    repository.removeMembership.mockResolvedValue({
      id: 'membership-target',
      userId: 'target-1',
      organizationId: 'org-1',
    });

    await expect(
      service.deleteOrganizationUser('actor-1', 'org-1', 'target-1'),
    ).resolves.toBeUndefined();
    expect(repository.removeMembership).toHaveBeenCalledWith(
      'org-1',
      'target-1',
    );
  });
});
