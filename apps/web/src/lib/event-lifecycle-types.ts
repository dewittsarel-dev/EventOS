export type LifecycleVersion = {
  id: string;
  version: number;
  status?: string;
};

export type LifecycleCollectionItem = {
  id: string;
  status: string;
  solutions?: Array<{ id: string }>;
  awards?: Array<{ id: string }>;
};

export type EventLifecycleContinuity = {
  eventId: string;
  chain: {
    brief: LifecycleVersion | null;
    design: LifecycleVersion | null;
    requirementSet: LifecycleVersion | null;
    moodBoard: LifecycleVersion | null;
    procurementPackages: LifecycleCollectionItem[];
    commercialWorkspaces: LifecycleCollectionItem[];
    assetReservations: number;
    execution: {
      id: string;
      status: string;
      executionPlanVersion: number;
    } | null;
    finance: { id: string; status: string } | null;
  };
  blockers: string[];
  executionReady: boolean;
  sourceOwnership: Record<string, string>;
};

export type EventLifecycleSynchronization = {
  eventId: string;
  executionId: string;
  financeWorkspaceId: string;
  commitmentsCreated: number;
  assetChangesCreated: number;
  automaticApprovalsPerformed: false;
};
