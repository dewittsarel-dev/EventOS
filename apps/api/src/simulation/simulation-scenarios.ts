export type SimulationScenarioComplexity =
  | 'SmallPrivateOrder'
  | 'SmallPrivateEvent'
  | 'MediumMultiSupplierEvent'
  | 'LargeCorporateEvent'
  | 'ExtremeEvent';

export type SimulationFailureMode =
  | 'UnavailableStock'
  | 'SupplierRejection'
  | 'SubstitutionRequired'
  | 'LateDelivery'
  | 'CustomerCancellation'
  | 'BudgetChange'
  | 'PaymentFailure';

export interface SimulationScenario {
  id: string;
  name: string;
  complexity: SimulationScenarioComplexity;
  attendeeCount: number;
  supplierCount: number;
  budget: number;
  lifecycle: readonly string[];
  failures: readonly SimulationFailureMode[];
}

const LIFECYCLE = [
  'MarketplaceDiscovery',
  'MarketplaceEnquiry',
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
] as const;

export function createSimulationScenarios(): SimulationScenario[] {
  return [
    {
      id: 'SIM-SCN-001',
      name: 'Private dinner furniture order [SYNTHETIC]',
      complexity: 'SmallPrivateOrder',
      attendeeCount: 12,
      supplierCount: 1,
      budget: 8500,
      lifecycle: LIFECYCLE,
      failures: ['UnavailableStock', 'PaymentFailure'],
    },
    {
      id: 'SIM-SCN-002',
      name: 'Backyard milestone celebration [SYNTHETIC]',
      complexity: 'SmallPrivateEvent',
      attendeeCount: 45,
      supplierCount: 4,
      budget: 68000,
      lifecycle: LIFECYCLE,
      failures: ['SubstitutionRequired', 'BudgetChange'],
    },
    {
      id: 'SIM-SCN-003',
      name: 'Wedding with coordinated suppliers [SYNTHETIC]',
      complexity: 'MediumMultiSupplierEvent',
      attendeeCount: 180,
      supplierCount: 12,
      budget: 480000,
      lifecycle: LIFECYCLE,
      failures: ['SupplierRejection', 'LateDelivery', 'BudgetChange'],
    },
    {
      id: 'SIM-SCN-004',
      name: 'National corporate product launch [SYNTHETIC]',
      complexity: 'LargeCorporateEvent',
      attendeeCount: 850,
      supplierCount: 28,
      budget: 3200000,
      lifecycle: LIFECYCLE,
      failures: ['UnavailableStock', 'SubstitutionRequired', 'PaymentFailure'],
    },
    {
      id: 'SIM-SCN-005',
      name: 'Multi-day public festival [SYNTHETIC]',
      complexity: 'ExtremeEvent',
      attendeeCount: 12000,
      supplierCount: 60,
      budget: 18500000,
      lifecycle: LIFECYCLE,
      failures: [
        'UnavailableStock',
        'SupplierRejection',
        'SubstitutionRequired',
        'LateDelivery',
        'CustomerCancellation',
        'BudgetChange',
        'PaymentFailure',
      ],
    },
  ];
}
