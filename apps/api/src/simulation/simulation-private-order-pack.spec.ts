import {
  assertSmallPrivateOrderPack,
  createSmallPrivateOrderPack,
} from './simulation-private-order-pack';

describe('small private order simulation pack', () => {
  const pack = createSmallPrivateOrderPack();

  it('creates deterministic customer, enquiry, opportunity and Draft Event fixtures', () => {
    expect(createSmallPrivateOrderPack()).toEqual(pack);
    expect(pack.synthetic).toBe(true);
    expect(pack.customer.email).toMatch(/\.invalid$/);
    expect(pack.enquiry.quantity).toBe(12);
    expect(pack.opportunity.confirmationEvidenceType).toBe('AcceptedQuotation');
    expect(pack.event.status).toBe('Draft');
  });

  it('uses a generated supplier image and excludes private ClientOS fields', () => {
    expect(pack.listing.imageProvenance).toBe(
      'GENERATED_FOR_EVENTOS_SIMULATION',
    );
    expect(pack.listing.publishedFields).toContain('availability');
    expect(pack.listing.publishedFields).not.toContain('costPrice');
    expect(pack.listing.publishedFields).not.toContain('internalNotes');
  });

  it('produces passing, traceable evidence across the complete lifecycle', () => {
    expect(assertSmallPrivateOrderPack(pack)).toBeUndefined();
    expect(pack.evidence).toHaveLength(12);
    expect(pack.evidence[0]?.stage).toBe('MarketplaceDiscovery');
    expect(pack.evidence.at(-1)?.stage).toBe('EventCloseout');
    expect(
      new Set(pack.evidence.map(({ checkpointId }) => checkpointId)).size,
    ).toBe(12);
    expect(
      pack.evidence
        .filter(({ humanDecisionRequired }) => humanDecisionRequired)
        .every(({ assertions }) =>
          assertions.some(({ evidence }) =>
            evidence.includes('human operator'),
          ),
        ),
    ).toBe(true);
  });

  it('records unavailable-stock and payment recovery at owning stages', () => {
    const procurement = pack.evidence.find(
      ({ stage }) => stage === 'Procurement',
    );
    expect(procurement?.status).toBe('recovered');
    expect(procurement?.failuresExercised).toEqual(['UnavailableStock']);
    const finance = pack.evidence.find(
      ({ stage }) => stage === 'FinanceReconciliation',
    );
    expect(finance?.failuresExercised).toEqual(['PaymentFailure']);
    expect(finance?.status).toBe('recovered');
  });
});
