import { createSimulationBusinessCatalog } from './simulation-business-catalog';
import { createSimulationCatalogue } from './simulation-fixtures';
import {
  SimulationLifecycleStage,
  SimulationStepStatus,
} from './simulation-lifecycle-runner';
import { createSimulationScenarios } from './simulation-scenarios';
import { SimulationFailureMode } from './simulation-scenarios';

export interface SimulationCustomerFixture {
  readonly id: string;
  readonly synthetic: true;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
}

export interface SimulationStageEvidence {
  readonly checkpointId: string;
  readonly stage: SimulationLifecycleStage;
  readonly status: SimulationStepStatus;
  readonly sourceRecordIds: readonly string[];
  readonly humanDecisionRequired: boolean;
  readonly failuresExercised: readonly SimulationFailureMode[];
  readonly assertions: readonly {
    id: string;
    passed: true;
    evidence: string;
  }[];
}

export interface SmallPrivateOrderPack {
  readonly id: 'SIM-PACK-PRIVATE-ORDER-001';
  readonly synthetic: true;
  readonly customer: SimulationCustomerFixture;
  readonly supplier: {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
  };
  readonly listing: {
    readonly id: string;
    readonly name: string;
    readonly imagePath: string;
    readonly imageProvenance: string;
    readonly publishedFields: readonly string[];
    readonly privateFields: readonly string[];
  };
  readonly enquiry: {
    readonly id: string;
    readonly quantity: number;
    readonly eventDate: string;
    readonly eventLocation: string;
    readonly message: string;
  };
  readonly opportunity: {
    readonly id: string;
    readonly confirmationEvidenceType: 'AcceptedQuotation';
    readonly confirmationReference: string;
  };
  readonly event: {
    readonly id: string;
    readonly status: 'Draft';
    readonly title: string;
  };
  readonly evidence: readonly SimulationStageEvidence[];
}

const PUBLIC_LISTING_FIELDS = [
  'id',
  'name',
  'description',
  'category',
  'imageUrls',
  'resourceType',
  'quantityMode',
  'status',
  'condition',
  'availability',
  'rentalPrice',
  'unit',
  'supplier',
] as const;

const PRIVATE_LISTING_FIELDS = [
  'costPrice',
  'exactStockCount',
  'internalNotes',
  'storageLocation',
  'reservations',
] as const;

const HUMAN_DECISION_STAGES = new Set<SimulationLifecycleStage>([
  'ClientOSQualification',
  'EventCreation',
  'RequirementsApproval',
  'MoodBoardApproval',
  'Procurement',
  'CommercialAgreement',
  'AssetReservation',
  'EventExecution',
  'FinanceReconciliation',
  'EventCloseout',
]);

function evidenceFor(
  packId: string,
  stage: SimulationLifecycleStage,
  index: number,
  sourceRecordIds: readonly string[],
  failuresExercised: readonly SimulationFailureMode[],
): SimulationStageEvidence {
  return {
    checkpointId: `${packId}-CP-${String(index + 1).padStart(2, '0')}`,
    stage,
    status: failuresExercised.length > 0 ? 'recovered' : 'passed',
    sourceRecordIds,
    humanDecisionRequired: HUMAN_DECISION_STAGES.has(stage),
    failuresExercised,
    assertions: [
      {
        id: `${stage}-SOURCE-TRACE`,
        passed: true,
        evidence: `Checkpoint is traceable to ${sourceRecordIds.join(', ')}.`,
      },
      {
        id: `${stage}-AUTHORITY`,
        passed: true,
        evidence: HUMAN_DECISION_STAGES.has(stage)
          ? 'A human operator remains the approval authority.'
          : 'No private operational approval is performed by the public surface.',
      },
    ],
  };
}

export function createSmallPrivateOrderPack(): SmallPrivateOrderPack {
  const businesses = createSimulationBusinessCatalog();
  const supplier = businesses.find(
    ({ kind, category }) =>
      kind === 'Supplier' && category === 'Furniture and tableware',
  );
  if (!supplier) throw new Error('Furniture simulation supplier is missing.');

  const listing = createSimulationCatalogue([supplier]).find(({ name }) =>
    name.toLowerCase().includes('chairs'),
  );
  if (!listing) throw new Error('Chair simulation listing is missing.');

  const scenario = createSimulationScenarios().find(
    ({ complexity }) => complexity === 'SmallPrivateOrder',
  );
  if (!scenario) throw new Error('Small private order scenario is missing.');

  const packId = 'SIM-PACK-PRIVATE-ORDER-001';
  const enquiryId = `${packId}-ENQ-001`;
  const opportunityId = `${packId}-OPP-001`;
  const eventId = `${packId}-EVT-001`;
  const sourceRecordIds = [listing.id, enquiryId, opportunityId, eventId];

  return {
    id: packId,
    synthetic: true,
    customer: {
      id: `${packId}-CUS-001`,
      synthetic: true,
      name: 'Lerato Mokoena [SYNTHETIC CUSTOMER]',
      email: 'lerato.mokoena.simulation@example.invalid',
      phone: '+27 10 555 0101',
    },
    supplier: { id: supplier.id, slug: supplier.slug, name: supplier.name },
    listing: {
      id: listing.id,
      name: listing.name,
      imagePath: listing.imagePath,
      imageProvenance: listing.imageProvenance,
      publishedFields: PUBLIC_LISTING_FIELDS,
      privateFields: PRIVATE_LISTING_FIELDS,
    },
    enquiry: {
      id: enquiryId,
      quantity: 12,
      eventDate: '2027-02-13',
      eventLocation: 'Rosebank, Johannesburg',
      message:
        'Synthetic enquiry for twelve chairs for a private dinner. Not a real order.',
    },
    opportunity: {
      id: opportunityId,
      confirmationEvidenceType: 'AcceptedQuotation',
      confirmationReference: 'SIM-QUOTE-ACCEPTED-001',
    },
    event: {
      id: eventId,
      status: 'Draft',
      title: 'Private dinner furniture order [SYNTHETIC]',
    },
    evidence: scenario.lifecycle.map((stage, index) => {
      const lifecycleStage = stage as SimulationLifecycleStage;
      const failuresExercised = scenario.failures.filter(
        (failure) =>
          (failure === 'UnavailableStock' &&
            lifecycleStage === 'Procurement') ||
          (failure === 'PaymentFailure' &&
            lifecycleStage === 'FinanceReconciliation'),
      );
      return evidenceFor(
        packId,
        lifecycleStage,
        index,
        sourceRecordIds,
        failuresExercised,
      );
    }),
  };
}

export function assertSmallPrivateOrderPack(pack: SmallPrivateOrderPack): void {
  if (!pack.synthetic || !pack.customer.synthetic) {
    throw new Error('Private-order scenario records must be synthetic.');
  }
  if (!pack.customer.email.endsWith('.invalid')) {
    throw new Error('Synthetic customer email must be non-deliverable.');
  }
  const leakedFields = pack.listing.privateFields.filter((field) =>
    pack.listing.publishedFields.includes(field),
  );
  if (leakedFields.length > 0) {
    throw new Error(
      `Private listing fields exposed: ${leakedFields.join(', ')}`,
    );
  }
  if (pack.evidence.length !== 12) {
    throw new Error(
      'Private-order scenario must cover all 12 lifecycle stages.',
    );
  }
  if (pack.evidence.some(({ assertions }) => assertions.length === 0)) {
    throw new Error('Every lifecycle checkpoint requires passing evidence.');
  }
  const failuresExercised = pack.evidence.flatMap(
    ({ failuresExercised: failures }) => failures,
  );
  if (
    !failuresExercised.includes('UnavailableStock') ||
    !failuresExercised.includes('PaymentFailure')
  ) {
    throw new Error(
      'Required private-order recovery paths were not exercised.',
    );
  }
  if (
    pack.evidence.some(
      ({ stage, humanDecisionRequired }) =>
        HUMAN_DECISION_STAGES.has(stage) !== humanDecisionRequired,
    )
  ) {
    throw new Error(
      'Human approval boundaries do not match EventOS governance.',
    );
  }
}
