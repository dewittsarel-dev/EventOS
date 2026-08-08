export type ClientBriefVersion = {
  id: string;
  version: number;
  clientName: string;
  eventName: string;
  eventDates: string[];
  venue: string | null;
  expectedGuests: number | null;
  budgetCents: number | null;
  eventType: string;
  clientObjectives: string | null;
  initialRequirements: string | null;
  notes: string | null;
  createdAt: string;
};

export type EventDesignVersion = {
  id: string;
  version: number;
  clientBriefVersionId: string;
  status: 'Draft' | 'Approved';
  seating: Record<string, unknown> | null;
  decor: Record<string, unknown> | null;
  catering: Record<string, unknown> | null;
  entertainment: Record<string, unknown> | null;
  lightingAndAv: Record<string, unknown> | null;
  branding: Record<string, unknown> | null;
  infrastructure: Record<string, unknown> | null;
  staffing: Record<string, unknown> | null;
  approvedAt: string | null;
  createdAt: string;
};

export type RequirementItem = {
  id: string;
  requirementCode: string;
  category: string;
  requirementType: 'Product' | 'Service' | 'Resource';
  name: string;
  description: string | null;
  quantityRequired: number;
  unit: string;
  quantitySource: 'AiCalculated' | 'PlannerOverride' | 'Manual';
  fulfilmentStrategy: string | null;
  status: string;
};

export type RequirementSet = {
  id: string;
  version: number;
  eventDesignVersionId: string;
  status: 'Draft' | 'Reviewed' | 'Approved';
  items: RequirementItem[];
  approvedAt: string | null;
  createdAt: string;
};

export type ClientBriefInput = {
  clientName: string;
  eventName: string;
  eventDates: string[];
  venue?: string;
  expectedGuests?: number;
  budgetCents?: number;
  eventType: string;
  clientObjectives?: string;
  initialRequirements?: string;
  notes?: string;
};

export type EventDesignInput = {
  clientBriefVersionId: string;
  seating?: Record<string, unknown>;
  decor?: Record<string, unknown>;
  catering?: Record<string, unknown>;
  entertainment?: Record<string, unknown>;
  lightingAndAv?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  infrastructure?: Record<string, unknown>;
  staffing?: Record<string, unknown>;
};

export type RequirementSetInput = {
  eventDesignVersionId: string;
  items: Array<{
    category: string;
    requirementType: 'Product' | 'Service' | 'Resource';
    name: string;
    description?: string;
    quantityRequired: number;
    unit: string;
    quantitySource: 'Manual';
    fulfilmentStrategy?: 'OwnInventory' | 'Marketplace' | 'ExternalSupplier' | 'Hybrid' | 'Undecided';
  }>;
};
