import { describe, expect, it } from 'vitest';
import { humanizeLabel } from './ui-labels';

describe('humanizeLabel', () => {
  it('turns internal workflow values into readable labels', () => {
    expect(humanizeLabel('PendingApproval')).toBe('Pending approval');
    expect(humanizeLabel('InProgress')).toBe('In progress');
    expect(humanizeLabel('EquipmentRental')).toBe('Equipment rental');
  });
});
