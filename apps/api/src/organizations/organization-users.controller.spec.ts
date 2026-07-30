import { Test, TestingModule } from '@nestjs/testing';
import { InviteOrganizationUserDto } from './dto/invite-organization-user.dto';
import { OrganizationContextQueryDto } from './dto/organization-context-query.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';
import { OrganizationService } from './organization.service';
import { OrganizationUsersController } from './organization-users.controller';

describe('OrganizationUsersController', () => {
  let controller: OrganizationUsersController;
  let service: {
    listOrganizationUsers: jest.Mock;
    inviteOrganizationUser: jest.Mock;
    updateOrganizationUser: jest.Mock;
    setOrganizationUserDisabled: jest.Mock;
    deleteOrganizationUser: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      listOrganizationUsers: jest.fn(),
      inviteOrganizationUser: jest.fn(),
      updateOrganizationUser: jest.fn(),
      setOrganizationUserDisabled: jest.fn(),
      deleteOrganizationUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationUsersController],
      providers: [
        {
          provide: OrganizationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<OrganizationUsersController>(
      OrganizationUsersController,
    );
  });

  it('lists users in the active organization', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };

    service.listOrganizationUsers.mockResolvedValue({
      data: [],
    });

    await expect(
      controller.findUsers({ id: 'user-1' } as never, query),
    ).resolves.toEqual({ data: [] });

    expect(service.listOrganizationUsers).toHaveBeenCalledWith(
      'user-1',
      query.organizationId,
    );
  });

  it('invites a user', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };
    const payload: InviteOrganizationUserDto = {
      name: 'Avery',
      email: 'avery@example.com',
      role: 'Manager',
    };

    service.inviteOrganizationUser.mockResolvedValue({
      membershipId: 'membership-1',
      userId: 'user-2',
      name: 'Avery',
      email: 'avery@example.com',
      role: 'Manager',
      status: 'Active',
    });

    await expect(
      controller.inviteUser({ id: 'user-1' } as never, query, payload),
    ).resolves.toEqual(
      expect.objectContaining({
        userId: 'user-2',
        role: 'Manager',
      }),
    );
  });

  it('edits an existing organization user', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };
    const payload: UpdateOrganizationUserDto = {
      name: 'Avery Updated',
      email: 'avery@example.com',
      role: 'Administrator',
    };

    service.updateOrganizationUser.mockResolvedValue({
      membershipId: 'membership-1',
      userId: 'user-2',
      name: 'Avery Updated',
      email: 'avery@example.com',
      role: 'Administrator',
      status: 'Active',
    });

    await expect(
      controller.editUser({ id: 'user-1' } as never, 'user-2', query, payload),
    ).resolves.toEqual(
      expect.objectContaining({
        role: 'Administrator',
      }),
    );
  });

  it('disables and enables an organization user', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };

    service.setOrganizationUserDisabled
      .mockResolvedValueOnce({
        userId: 'user-2',
        status: 'Disabled',
      })
      .mockResolvedValueOnce({
        userId: 'user-2',
        status: 'Active',
      });

    await expect(
      controller.disableUser({ id: 'user-1' } as never, 'user-2', query),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'Disabled',
      }),
    );

    await expect(
      controller.enableUser({ id: 'user-1' } as never, 'user-2', query),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'Active',
      }),
    );
  });

  it('deletes an organization user membership', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };

    service.deleteOrganizationUser.mockResolvedValue(undefined);

    await expect(
      controller.deleteUser({ id: 'user-1' } as never, 'user-2', query),
    ).resolves.toBeUndefined();

    expect(service.deleteOrganizationUser).toHaveBeenCalledWith(
      'user-1',
      query.organizationId,
      'user-2',
    );
  });
});
