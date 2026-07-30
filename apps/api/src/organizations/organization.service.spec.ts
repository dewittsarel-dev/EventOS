import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { OrganizationPrismaRepository } from './organization.prisma-repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsQueryDto } from './dto/find-organizations-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    findMembership: jest.Mock;
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
});
