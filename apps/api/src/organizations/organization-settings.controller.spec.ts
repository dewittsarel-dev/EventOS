import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationSettingsController } from './organization-settings.controller';
import { OrganizationService } from './organization.service';
import { OrganizationContextQueryDto } from './dto/organization-context-query.dto';
import { UpdateOrganizationLogoDto } from './dto/update-organization-logo.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

describe('OrganizationSettingsController', () => {
  let controller: OrganizationSettingsController;
  let service: {
    findAccessibleById: jest.Mock;
    updateSettings: jest.Mock;
    updateLogo: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAccessibleById: jest.fn(),
      updateSettings: jest.fn(),
      updateLogo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationSettingsController],
      providers: [
        {
          provide: OrganizationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<OrganizationSettingsController>(
      OrganizationSettingsController,
    );
  });

  it('gets organization settings for the active organization', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };
    const user = { id: 'user-1' };
    const result = {
      id: query.organizationId,
      name: 'EventOS Pty Ltd',
      slug: 'eventos',
      email: 'ops@eventos.example',
    };

    service.findAccessibleById.mockResolvedValue(result);

    await expect(
      controller.getOrganization(user as never, query),
    ).resolves.toEqual(result);
    expect(service.findAccessibleById).toHaveBeenCalledWith(
      'user-1',
      query.organizationId,
    );
  });

  it('updates organization settings', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };
    const payload: UpdateOrganizationSettingsDto = {
      companyName: 'EventOS Pty Ltd',
      email: 'ops@eventos.example',
      tradingName: 'EventOS',
    };

    const updated = {
      id: query.organizationId,
      name: payload.companyName,
      email: payload.email,
    };

    service.updateSettings.mockResolvedValue(updated);

    await expect(
      controller.updateOrganization({ id: 'user-1' } as never, query, payload),
    ).resolves.toEqual(updated);
    expect(service.updateSettings).toHaveBeenCalledWith(
      'user-1',
      query.organizationId,
      payload,
    );
  });

  it('updates organization logo placeholder', async () => {
    const query: OrganizationContextQueryDto = {
      organizationId: '11111111-1111-4111-8111-111111111111',
    };
    const payload: UpdateOrganizationLogoDto = {
      logoUrl: 'https://cdn.example.com/logo.png',
    };

    const updated = {
      id: query.organizationId,
      logoUrl: payload.logoUrl,
    };

    service.updateLogo.mockResolvedValue(updated);

    await expect(
      controller.updateOrganizationLogo(
        { id: 'user-1' } as never,
        query,
        payload,
      ),
    ).resolves.toEqual(updated);
    expect(service.updateLogo).toHaveBeenCalledWith(
      'user-1',
      query.organizationId,
      payload.logoUrl,
    );
  });
});
