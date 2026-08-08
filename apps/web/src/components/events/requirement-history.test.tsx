import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { overrideRequirementQuantity } from '../../lib/event-planning-api';
import { RequirementHistory } from './requirement-history';

vi.mock('../../lib/event-planning-api', () => ({
  approveRequirementSet: vi.fn(),
  overrideRequirementQuantity: vi.fn(),
}));

describe('RequirementHistory', () => {
  it('creates a reasoned quantity override as a new version', async () => {
    vi.mocked(overrideRequirementQuantity).mockResolvedValue({} as never);
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(
      <RequirementHistory
        eventId="event-1"
        token="token-1"
        baseUrl="http://localhost:3001"
        sets={[{
          id: 'set-1',
          version: 1,
          status: 'Approved',
          items: [{
            id: 'item-1',
            requirementCode: 'R-001',
            name: 'Dining chairs',
            category: 'Furniture',
            requirementType: 'Product',
            quantityRequired: 100,
            unit: 'Each',
            quantitySource: 'Manual',
            status: 'Approved',
          }],
        } as never]}
        onChanged={onChanged}
        onError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('New quantity for R-001'), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Override reason for R-001'), { target: { value: 'Revised guest count' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create override version' }));

    await waitFor(() => expect(overrideRequirementQuantity).toHaveBeenCalledWith(
      { token: 'token-1', baseUrl: 'http://localhost:3001' },
      'event-1',
      'set-1',
      { requirementCode: 'R-001', quantityRequired: 120, reason: 'Revised guest count' },
    ));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});
