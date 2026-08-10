import {
  assertVisualMultiSupplierEventPack,
  createVisualMultiSupplierEventPack,
} from './simulation-visual-event-pack';

describe('first visual multi-supplier event and mood-board scenario', () => {
  const pack = createVisualMultiSupplierEventPack();

  it('runs deterministically across five synthetic business categories', () => {
    expect(createVisualMultiSupplierEventPack()).toEqual(pack);
    expect(pack.result.status).toBe('PASSED');
    expect(new Set(pack.suppliers.map(({ id }) => id)).size).toBe(5);
    expect(pack.moodBoard.zones).toHaveLength(4);
    expect(() => assertVisualMultiSupplierEventPack(pack)).not.toThrow();
  });

  it('builds the approved 100-guest three-row draft layout', () => {
    const quantityFor = (name: string) =>
      pack.lineItems.find((item) => item.listingName.includes(name))?.quantity;

    expect(pack.event.guestCount).toBe(100);
    expect(quantityFor('Long Oak Banquet Table')).toBe(10);
    expect(quantityFor('Gold Chiavari Chair')).toBe(100);
    expect(quantityFor('Sage Table Runner')).toBe(10);
    expect(quantityFor('Low Floral Arrangement')).toBe(20);
    expect(pack.moodBoard.instructions.join(' ')).toContain(
      'three parallel rows',
    );
    expect(pack.moodBoard.status).toBe('AI_DRAFT_AWAITING_OPERATOR_APPROVAL');
  });

  it('uses only generated visual evidence and keeps recovery decisions human-controlled', () => {
    expect(
      pack.lineItems.every(({ imagePath }) =>
        imagePath.startsWith('/simulation/catalogue/'),
      ),
    ).toBe(true);
    expect(
      pack.recoveryTests.every(
        ({ automaticCommitmentAllowed }) => !automaticCommitmentAllowed,
      ),
    ).toBe(true);
  });
});
