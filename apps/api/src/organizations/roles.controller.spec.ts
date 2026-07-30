import { Test, TestingModule } from '@nestjs/testing';
import { CreateRoleDto } from './dto/create-role.dto';
import { OrganizationContextQueryDto } from './dto/organization-context-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { OrganizationService } from './organization.service';
import { RolesController } from './roles.controller';

describe('RolesController', () => {
  let controller: RolesController;
  let service: {
    listRoles: jest.Mock;
    findRoleById: jest.Mock;
    createRole: jest.Mock;
    updateRole: jest.Mock;
    deleteRole: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      listRoles: jest.fn(),
      findRoleById: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: OrganizationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
  });

  it('lists roles', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };

    service.listRoles.mockResolvedValue({ data: [] });

    await expect(
      controller.findAll({ id: 'user-1' } as never, query),
    ).resolves.toEqual({
      data: [],
    });
  });

  it('gets a single role', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };

    service.findRoleById.mockResolvedValue({ id: 'role-1', name: 'Manager' });

    await expect(
      controller.findOne({ id: 'user-1' } as never, 'role-1', query),
    ).resolves.toEqual(
      expect.objectContaining({ id: 'role-1', name: 'Manager' }),
    );
  });

  it('creates a role', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };
    const payload: CreateRoleDto = {
      name: 'Field Coordinator',
      description: 'Coordinates field teams',
      permissions: {
        Dashboard: {
          View: true,
          Create: false,
          Edit: false,
          Delete: false,
        },
      },
    };

    service.createRole.mockResolvedValue({ id: 'role-2', name: payload.name });

    await expect(
      controller.create({ id: 'user-1' } as never, query, payload),
    ).resolves.toEqual(expect.objectContaining({ id: 'role-2' }));
  });

  it('updates a role', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };
    const payload: UpdateRoleDto = {
      name: 'Field Coordinator',
      description: 'Updated',
      permissions: {
        Dashboard: {
          View: true,
          Create: true,
          Edit: true,
          Delete: false,
        },
      },
    };

    service.updateRole.mockResolvedValue({ id: 'role-2', name: payload.name });

    await expect(
      controller.update({ id: 'user-1' } as never, 'role-2', query, payload),
    ).resolves.toEqual(expect.objectContaining({ id: 'role-2' }));
  });

  it('deletes a role', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };

    service.deleteRole.mockResolvedValue(undefined);

    await expect(
      controller.remove({ id: 'user-1' } as never, 'role-2', query),
    ).resolves.toBeUndefined();
  });
});
