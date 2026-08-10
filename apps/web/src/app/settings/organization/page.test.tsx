import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrganizationSettingsPage from './page';

const getOrganizationSettings = vi.fn();
const updateOrganizationSettings = vi.fn();
const updateOrganizationLogo = vi.fn();

vi.mock('../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({
    session: {
      token: 'token-1',
      baseUrl: 'http://localhost:3001',
      organizationId: '11111111-1111-4111-8111-111111111111',
    },
    activeOrganization: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'EventOS',
      slug: 'eventos',
    },
  }),
}));

vi.mock('../../../lib/organization-settings-api', () => ({
  getOrganizationSettings: (...args: unknown[]) => getOrganizationSettings(...args),
  updateOrganizationSettings: (...args: unknown[]) => updateOrganizationSettings(...args),
  updateOrganizationLogo: (...args: unknown[]) => updateOrganizationLogo(...args),
}));

describe('OrganizationSettingsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    getOrganizationSettings.mockReset();
    updateOrganizationSettings.mockReset();
    updateOrganizationLogo.mockReset();

    getOrganizationSettings.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'EventOS Pty Ltd',
      slug: 'eventos',
      tradingName: 'EventOS',
      vatNumber: null,
      registrationNumber: null,
      email: 'ops@eventos.example',
      phone: null,
      website: null,
      physicalAddress: null,
      postalAddress: null,
      logoUrl: null,
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    updateOrganizationSettings.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'EventOS Holdings',
      slug: 'eventos',
      tradingName: 'EventOS',
      vatNumber: null,
      registrationNumber: null,
      email: 'finance@eventos.example',
      phone: null,
      website: null,
      physicalAddress: null,
      postalAddress: null,
      logoUrl: null,
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });

    updateOrganizationLogo.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'EventOS Holdings',
      slug: 'eventos',
      tradingName: 'EventOS',
      vatNumber: null,
      registrationNumber: null,
      email: 'finance@eventos.example',
      phone: null,
      website: null,
      physicalAddress: null,
      postalAddress: null,
      logoUrl: 'https://cdn.example.com/logo.png',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    });
  });

  it('loads and displays organization settings form values', async () => {
    render(<OrganizationSettingsPage />);

    expect(await screen.findByDisplayValue('EventOS Pty Ltd')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ops@eventos.example')).toBeInTheDocument();
  });

  it('saves organization settings and logo placeholder', async () => {
    render(<OrganizationSettingsPage />);

    const companyName = await screen.findByLabelText('Company Name');
    const email = screen.getByLabelText('Email');
    const logoUrl = screen.getByLabelText('Company Logo URL Placeholder');

    fireEvent.change(companyName, { target: { value: 'EventOS Holdings' } });
    fireEvent.change(email, { target: { value: 'finance@eventos.example' } });
    fireEvent.change(logoUrl, { target: { value: 'https://cdn.example.com/logo.png' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateOrganizationSettings).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(updateOrganizationLogo).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Organization settings saved.')).toBeInTheDocument();
  });

  it('tracks the operator-managed supplier and planner test journey', async () => {
    render(<OrganizationSettingsPage />);

    const enable = await screen.findByRole('button', {
      name: 'Use this organization as my simulation reference company',
    });
    fireEvent.click(enable);

    expect(screen.getByText('Supplier + planner test journey')).toBeInTheDocument();
    const profileStep = screen.getByLabelText(
      'Mark Complete the test company profile complete',
    );
    fireEvent.click(profileStep);

    expect(screen.getByText('1 of 6 setup steps complete.')).toBeInTheDocument();
    expect(window.localStorage.getItem(
      'eventos:operator-reference:11111111-1111-4111-8111-111111111111',
    )).toContain('profile');
  });
});
