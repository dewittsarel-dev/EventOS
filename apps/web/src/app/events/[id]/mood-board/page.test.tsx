import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoodBoardPage from './page';

const listRequirementSets = vi.fn();
const listMoodBoards = vi.fn();

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'event-1' }) }));
vi.mock('../../../../components/app-shell/session-context', () => ({
  useAppSession: () => ({ session: { token: 'token-1', baseUrl: 'http://localhost:3001' } }),
}));
vi.mock('../../../../lib/event-planning-api', () => ({
  listRequirementSets: (...args: unknown[]) => listRequirementSets(...args),
}));
vi.mock('../../../../lib/mood-board-api', () => ({
  listMoodBoards: (...args: unknown[]) => listMoodBoards(...args),
  createMoodBoard: vi.fn(),
  submitMoodBoardReview: vi.fn(),
  commentOnMoodBoard: vi.fn(),
  requestMoodBoardChanges: vi.fn(),
  approveMoodBoard: vi.fn(),
}));

describe('MoodBoardPage', () => {
  beforeEach(() => {
    listRequirementSets.mockResolvedValue([]);
    listMoodBoards.mockResolvedValue([{
      id: 'board-1',
      version: 1,
      title: 'Summer Wedding Concept',
      status: 'InClientReview',
      scenes: [{
        id: 'scene-1',
        sceneKey: 'main-hall',
        name: 'Main Hall',
        objects: [{
          id: 'object-1',
          objectKey: 'OBJ-001',
          requirementItemId: 'item-1',
          name: 'Gold Tiffany Chair',
          source: 'PlannerLibrary',
          sourceReferenceId: 'library-1',
          imageUrl: 'https://example.com/chair.jpg',
          locked: false,
          requirementItem: { requirementCode: 'R-001' },
        }],
      }],
      reviews: [],
    }]);
  });

  it('renders governed visual objects and explicit review actions', async () => {
    render(<MoodBoardPage />);

    expect(await screen.findByText('Summer Wedding Concept')).toBeInTheDocument();
    expect(screen.getByText('Gold Tiffany Chair')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve visual design' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request changes' })).toBeInTheDocument();
  });
});
