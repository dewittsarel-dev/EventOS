import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceSearch } from './workspace-search';

describe('WorkspaceSearch', () => {
  it('finds and opens a workspace destination', () => {
    const navigate = vi.fn();
    render(<WorkspaceSearch open onClose={vi.fn()} onNavigate={navigate} />);
    fireEvent.change(screen.getByLabelText('Find a workspace or action'), { target: { value: 'marketplace' } });
    fireEvent.click(screen.getByRole('button', { name: /Marketplace management/ }));
    expect(navigate).toHaveBeenCalledWith('/settings/marketplace');
  });

  it('opens the first result with Enter', () => {
    const navigate = vi.fn();
    render(<WorkspaceSearch open onClose={vi.fn()} onNavigate={navigate} />);
    const input = screen.getByLabelText('Find a workspace or action');
    fireEvent.change(input, { target: { value: 'create event' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(navigate).toHaveBeenCalledWith('/events/new');
  });
});
