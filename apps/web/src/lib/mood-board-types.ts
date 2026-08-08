export type MoodBoardObjectSource = 'Marketplace' | 'PlannerLibrary' | 'ClientUpload' | 'AiConcept';

export type MoodBoard = {
  id: string;
  basedOnMoodBoardId?: string | null;
  version: number;
  title: string;
  requirementSetId: string;
  status: 'Draft' | 'InClientReview' | 'ChangesRequested' | 'Approved';
  scenes: Array<{
    id: string;
    sceneKey: string;
    name: string;
    description: string | null;
    objects: Array<{
      id: string;
      objectKey: string;
      requirementItemId: string;
      name: string;
      source: MoodBoardObjectSource;
      sourceReferenceId: string;
      supplierName: string | null;
      marketplaceListingId: string | null;
      imageUrl: string;
      locked: boolean;
      presentation: { placementInstructions?: string } | null;
      requirementItem: { requirementCode: string };
    }>;
  }>;
  reviews: Array<{
    id: string;
    type: 'Comment' | 'ChangeRequest' | 'Approval';
    comment: string | null;
    createdAt: string;
  }>;
};

export type MoodBoardComparison = {
  fromVersion: number;
  toVersion: number;
  changes: Array<{
    objectKey: string;
    change: 'Added' | 'Removed' | 'Changed';
    before?: { name: string; requirementItemId: string };
    after?: { name: string; requirementItemId: string };
  }>;
  affectedRequirementItemIds: string[];
  requiresRequirementImpactReview: boolean;
  procurementUpdated: false;
};
