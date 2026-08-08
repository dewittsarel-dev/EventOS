import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { applyRequirementImpactReport } from '../../lib/event-planning-api';
import { RequirementImpactPanel } from './requirement-impact-panel';

vi.mock('../../lib/event-planning-api', () => ({
  createRequirementImpactReport: vi.fn(),
  applyRequirementImpactReport: vi.fn(),
}));

describe('RequirementImpactPanel', () => {
  it('requires and submits an explicit planner decision for every change', async () => {
    vi.mocked(applyRequirementImpactReport).mockResolvedValue({} as never);
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(
      <RequirementImpactPanel
        eventId="event-1"
        token="token-1"
        baseUrl="http://localhost:3001"
        sets={[]}
        reports={[{
          id: 'report-1',
          baselineRequirementSetId: 'set-1',
          status: 'PendingReview',
          affectedItems: 1,
          newItems: 0,
          removedItems: 0,
          plannerOverrides: 0,
          requiresProcurementReview: true,
          businessImpact: {},
          createdAt: '2026-08-08T00:00:00.000Z',
          changes: [{
            id: 'change-1',
            requirementCode: 'R-001',
            changeType: 'QuantityChanged',
            previousItem: { quantityRequired: 100 },
            proposedItem: { quantityRequired: 120 },
            decision: 'Pending',
          }],
        }]}
        onChanged={onChanged}
        onError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Decision for R-001'), { target: { value: 'Apply' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply reviewed decisions' }));

    await waitFor(() => expect(applyRequirementImpactReport).toHaveBeenCalledWith(
      { token: 'token-1', baseUrl: 'http://localhost:3001' },
      'event-1',
      'report-1',
      [{ changeId: 'change-1', decision: 'Apply' }],
    ));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});
