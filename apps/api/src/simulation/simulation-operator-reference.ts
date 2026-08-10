import { isAutomatedSimulationOwnedSlug } from './simulation-persistence';

export const OPERATOR_REFERENCE_COMPANY = {
  suggestedSlug: 'operator-reference-decor-planning',
  displayName: 'Operator Reference Decor & Planning [TEST]',
  roles: ['Supplier', 'EventPlanner'] as const,
  dataClassification: 'SyntheticOperatorManaged',
  resetPolicy: 'Preserve',
} as const;

export const OPERATOR_REFERENCE_LIFECYCLE = [
  'CompanyProfile',
  'TeamAndPermissions',
  'InventoryLocations',
  'CatalogueAndImages',
  'MarketplacePublication',
  'MarketplaceEnquiry',
  'ClientOSQualification',
  'EventPlanning',
  'ProcurementAndReservation',
  'EventExecution',
  'FinanceReconciliation',
  'EventCloseout',
] as const;

export function assertOperatorReferenceCompanyIsProtected(): void {
  if (
    isAutomatedSimulationOwnedSlug(OPERATOR_REFERENCE_COMPANY.suggestedSlug)
  ) {
    throw new Error(
      'The operator reference company must not be owned by automated simulator reset.',
    );
  }
}
