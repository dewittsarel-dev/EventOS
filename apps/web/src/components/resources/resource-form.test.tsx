import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResourceForm } from './resource-form';

describe('ResourceForm', () => {
  it('saves a guided resource as a private ClientOS draft by default', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ResourceForm busy={false} submitLabel="Save draft" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Simple product name'), { target: { value: 'Gold Tiffany Chair' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Gold Tiffany Chair',
      category: 'Furniture & seating',
      visibility: 'PRIVATE',
      tags: expect.arrayContaining(['subcategory:Chairs']),
      keywords: expect.arrayContaining(['gold', 'tiffany', 'chair']),
    }));
  });

  it('publishes only after the supplier explicitly selects Marketplace visibility', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ResourceForm busy={false} submitLabel="Save draft" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Simple product name'), { target: { value: 'Gold Tiffany Chair' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Publish this item to Marketplace/i }));
    expect(screen.getAllByText(/neutral placeholder/i)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Save and publish' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ visibility: 'MARKETPLACE' }));
  });
});
