import type { RequirementItem } from './event-planning-types';

export type ProcurementPackageStatus =
  | 'Draft'
  | 'Analysed'
  | 'SolutionSelected'
  | 'QuotationRequested';

export type ProcurementSolutionStrategy =
  | 'LowestCost'
  | 'LowestRisk'
  | 'FewestSuppliers'
  | 'HighestConfidence'
  | 'PreferLocal'
  | 'Balanced';

export type ProcurementPolicy = {
  minimiseCost: boolean;
  minimiseSuppliers: boolean;
  supportEmergingBusinesses: boolean;
  preferLocalSuppliers: boolean;
  environmentalPreference: boolean;
  preferExistingRelationships: boolean;
  balancedMarketplace: boolean;
  minimumReliabilityPercent: number;
  maximumSuppliersPerPackage: number;
};

export type ProcurementAllocation = {
  id: string;
  requirementItemId: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  estimatedCost: number | null;
  confidenceScore: number;
  riskScore: number;
  deliveryCapability: string;
};

export type ProcurementSolution = {
  id: string;
  rank: number;
  strategy: ProcurementSolutionStrategy;
  label: string;
  estimatedTotalCost: number | null;
  currency: string | null;
  confidenceScore: number;
  riskScore: number;
  supplierCount: number;
  explanation: string;
  tradeOffs: Record<string, unknown>;
  selectedAt: string | null;
  allocations: ProcurementAllocation[];
};

export type ProcurementPackage = {
  id: string;
  requirementSetId: string;
  name: string;
  category: string;
  status: ProcurementPackageStatus;
  policy: ProcurementPolicy;
  quotationRequestedAt: string | null;
  items: Array<{ requirementItemId: string; requirementItem: RequirementItem }>;
  solutions: ProcurementSolution[];
  createdAt: string;
};

export type ProcurementAnalysis = {
  id: string;
  credibleSolutionCount: number;
  reasonFewerThanFive: string | null;
  solutions: ProcurementSolution[];
};

export type CreateProcurementPackageInput = {
  requirementSetId: string;
  name: string;
  category: string;
  requirementItemIds: string[];
  policy: ProcurementPolicy;
};

