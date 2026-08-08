/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { ConflictException } from '@nestjs/common';
import { ProcurementPackageStatus, RequirementSetStatus } from '@prisma/client';
import { ProcurementService } from './procurement.service';

describe('ProcurementService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const setId = '55555555-5555-5555-5555-555555555555';
  const itemId = '66666666-6666-6666-6666-666666666666';
  const packageId = '77777777-7777-7777-7777-777777777777';

  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    requirementSet: { findUnique: jest.fn() },
    moodBoard: { findFirst: jest.fn() },
    procurementPackage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    procurementAnalysis: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    procurementSolution: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    procurementSolutionAllocation: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const marketplace = { searchCapability: jest.fn() };

  let service: ProcurementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProcurementService(prisma as never, marketplace as never);
    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.requirementSet.findUnique.mockResolvedValue({
      id: setId,
      eventId,
      status: RequirementSetStatus.Approved,
      items: [{ id: itemId }],
    });
    prisma.moodBoard.findFirst.mockResolvedValue({ id: 'board-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('requires an approved Mood Board before creating a package', async () => {
    prisma.moodBoard.findFirst.mockResolvedValue(null);

    await expect(
      service.createPackage(userId, eventId, {
        requirementSetId: setId,
        name: 'Furniture Package',
        category: 'Furniture',
        requirementItemIds: [itemId],
        policy: {},
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('stores explicit buyer policy and grouped requirements', async () => {
    prisma.procurementPackage.create.mockResolvedValue({ id: packageId });

    await service.createPackage(userId, eventId, {
      requirementSetId: setId,
      name: 'Furniture Package',
      category: 'Furniture',
      requirementItemIds: [itemId],
      policy: { minimiseCost: true, maximumSuppliersPerPackage: 2 },
    });

    expect(prisma.procurementPackage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          policy: expect.objectContaining({
            minimiseCost: true,
            maximumSuppliersPerPackage: 2,
            balancedMarketplace: false,
          }),
          items: { create: [{ requirementItemId: itemId }] },
        }),
      }),
    );
  });

  it('presents at least five distinct solutions when five are credible', async () => {
    prisma.procurementPackage.findUnique.mockResolvedValue({
      id: packageId,
      eventId,
      status: ProcurementPackageStatus.Draft,
      policy: {
        minimiseCost: true,
        minimiseSuppliers: true,
        maximumSuppliersPerPackage: 2,
      },
      event: {
        startDateTime: new Date('2026-10-01T08:00:00.000Z'),
        endDateTime: new Date('2026-10-01T18:00:00.000Z'),
        location: 'Pretoria',
        venue: 'Venue',
      },
      items: [
        {
          requirementItem: {
            id: itemId,
            name: 'Gold Tiffany Chairs',
            quantityRequired: 600,
            specification: { colour: 'Gold' },
            deliveryDate: null,
            collectionDate: null,
            venue: 'Pretoria',
          },
        },
      ],
    });
    marketplace.searchCapability.mockResolvedValue({
      suppliers: Array.from({ length: 5 }, (_, index) => ({
        supplierId: `supplier-${index + 1}`,
        supplierName: `Supplier ${index + 1}`,
        ownAvailableQuantity: 600,
        ownCoveragePercentage: 100,
        sourcedCoveragePercentage: 0,
        totalPotentiallyFulfillableQuantity: 600,
        usesAdditionalMarketplaceSourcing: false,
        marketplaceSecondarySupplierCount: 0,
        fulfilmentConfidenceScore: 95 - index,
        fulfilmentConfidence: 'HIGH',
        exactSpecificationMatch: true,
        estimatedTotalCost: 200000 + index * 1000,
        fulfilmentRiskScore: 5 + index,
        distanceKmEstimate: 10 + index * 5,
        estimatedDeliveryCapability: 'LOCAL_DELIVERY_STRONG',
        reliabilityRating: 5,
        reliabilityBand: 'ESTABLISHED',
        indicativeUnitPrice: 300,
        pricingCurrency: 'ZAR',
        fulfilmentStatus: 'OWN_STOCK',
      })),
    });
    prisma.procurementAnalysis.create.mockResolvedValue({ id: 'analysis-1' });
    let solutionNumber = 0;
    prisma.procurementSolution.create.mockImplementation(async () => ({
      id: `solution-${++solutionNumber}`,
    }));
    prisma.procurementAnalysis.findUniqueOrThrow.mockResolvedValue({
      id: 'analysis-1',
      credibleSolutionCount: 5,
    });

    await service.analyse(userId, eventId, packageId);

    expect(prisma.procurementSolution.create).toHaveBeenCalledTimes(5);
    expect(prisma.procurementSolution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        explanation: expect.stringContaining('Shown because'),
        tradeOffs: expect.objectContaining({ noHiddenObjective: true }),
      }),
    });
  });

  it('records planner selection without reserving or ordering', async () => {
    prisma.procurementSolution.findUnique.mockResolvedValue({
      id: 'solution-1',
      procurementPackageId: packageId,
      procurementPackage: {
        eventId,
        status: ProcurementPackageStatus.Analysed,
      },
    });
    prisma.procurementPackage.update.mockResolvedValue({
      id: packageId,
      status: ProcurementPackageStatus.SolutionSelected,
    });

    await service.selectSolution(userId, eventId, packageId, 'solution-1');

    expect(prisma.procurementSolution.update).toHaveBeenCalledWith({
      where: { id: 'solution-1' },
      data: { selectedAt: expect.any(Date), selectedByUserId: userId },
    });
  });

  it('hands off to M008 without preparing or sending RFQs', async () => {
    prisma.procurementPackage.findUnique.mockResolvedValue({
      id: packageId,
      eventId,
      status: ProcurementPackageStatus.SolutionSelected,
      solutions: [{ id: 'solution-1', allocations: [] }],
    });
    prisma.procurementPackage.update.mockResolvedValue({
      id: packageId,
      status: ProcurementPackageStatus.QuotationRequested,
    });

    const result = await service.requestQuotations(userId, eventId, packageId);

    expect(result.handoff).toBe('M008_COMMERCIAL_WORKSPACE');
    expect(result.rfqsPrepared).toBe(false);
    expect(result.rfqsSent).toBe(false);
    expect(result.operatorApprovalStillRequired).toBe(true);
  });
});
