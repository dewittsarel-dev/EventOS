export type AssetDefinition = {
  id: string; assetDefinitionId: string; assetCode: string; name: string; description: string | null;
  classification: string; category: string; trackingMode: 'Serialized' | 'Quantity' | 'Batch' | 'Kit';
  ownershipType: string; unitOfMeasure: string; quantityOnHand: number; quantityUnavailable: number;
  capabilityTags: string[]; active: boolean;
};

export type AssetInstance = {
  id: string; assetInstanceId: string; operationalCode: string; manufacturerSerial: string | null;
  qrIdentity: string | null; lifecycleStatus: string; conditionGrade: string | null;
  assetDefinition: AssetDefinition;
};

export type AssetSearchResult = { definitions: AssetDefinition[]; instances: AssetInstance[] };

export type AssetGovernanceSummary = {
  readOnly: true; definitions: number;
  instances: Array<{ lifecycleStatus: string; _count: number }>;
  reservations: Array<{ status: string; _count: number }>;
  incidents: Array<{ status: string; _count: number }>;
  maintenance: Array<{ status: string; _count: number }>;
  unresolvedGovernanceExceptions: number;
};

