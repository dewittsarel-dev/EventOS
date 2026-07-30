import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  it('creates an organization', async () => {
    const payload: CreateOrganizationDto = { name: 'EventOS', slug: 'eventos' };
    const created = {
      id: 'org-1',
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    service.create.mockResolvedValue(created);

    await expect(controller.create(payload)).resolves.toEqual(created);
    expect(service.create).toHaveBeenCalledWith(payload);
  });

  it('lists organizations', async () => {
    const query: FindOrganizationsQueryDto = {
      page: 1,
      limit: 10,
      name: 'Event',
    };
    const result = {
      data: [{ id: 'org-1', name: 'EventOS', slug: 'eventos' }],
      meta: { page: 1, limit: 10, total: 1 },
    };

    service.findAll.mockResolvedValue(result);

    await expect(controller.findAll(query)).resolves.toEqual(result);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('gets an organization', async () => {
    const organization = { id: 'org-1', name: 'EventOS', slug: 'eventos' };

    service.findOne.mockResolvedValue(organization);

    await expect(controller.findOne('org-1')).resolves.toEqual(organization);
    expect(service.findOne).toHaveBeenCalledWith('org-1');
  });

  it('updates an organization', async () => {
    const payload: UpdateOrganizationDto = { name: 'Updated' };
    const updated = {
      id: 'org-1',
      name: 'Updated',
      slug: 'eventos',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    service.update.mockResolvedValue(updated);

    await expect(controller.update('org-1', payload)).resolves.toEqual(updated);
    expect(service.update).toHaveBeenCalledWith('org-1', payload);
  });
});
