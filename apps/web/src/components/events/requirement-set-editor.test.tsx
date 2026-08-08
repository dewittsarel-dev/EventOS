import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createRequirementSet } from '../../lib/event-planning-api';
import { RequirementSetEditor } from './requirement-set-editor';

vi.mock('../../lib/event-planning-api', () => ({ createRequirementSet: vi.fn() }));

describe('RequirementSetEditor', () => {
  it('creates multiple requirements with an explicit dependency', async () => {
    vi.mocked(createRequirementSet).mockResolvedValue({} as never);
    const onCreated = vi.fn().mockResolvedValue(undefined);

    render(
      <RequirementSetEditor
        eventId="event-1"
        token="token-1"
        baseUrl="http://localhost:3001"
        designs={[{ id: 'design-1', version: 2, status: 'Approved' } as never]}
        onCreated={onCreated}
        onError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('Select approved design'), {
      target: { value: 'design-1' },
    });
    const first = screen.getByText('Requirement 1').closest('fieldset')!;
    fireEvent.change(within(first).getByPlaceholderText('Category'), { target: { value: 'Furniture' } });
    fireEvent.change(within(first).getByPlaceholderText('Requirement name'), { target: { value: 'Dining tables' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add requirement' }));
    const second = screen.getByText('Requirement 2').closest('fieldset')!;
    fireEvent.change(within(second).getByPlaceholderText('Category'), { target: { value: 'Furniture' } });
    fireEvent.change(within(second).getByPlaceholderText('Requirement name'), { target: { value: 'Dining chairs' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add dependency' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Requirement Set' }));

    await waitFor(() => expect(createRequirementSet).toHaveBeenCalled());
    expect(vi.mocked(createRequirementSet).mock.calls[0][2]).toEqual(
      expect.objectContaining({
        eventDesignVersionId: 'design-1',
        items: expect.arrayContaining([
          expect.objectContaining({ name: 'Dining tables' }),
          expect.objectContaining({ name: 'Dining chairs' }),
        ]),
        dependencies: [
          expect.objectContaining({
            sourceItemNumber: 1,
            targetItemNumber: 2,
            level: 'Direct',
          }),
        ],
      }),
    );
  });
});
