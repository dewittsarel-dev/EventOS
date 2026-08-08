export type MoodBoardObjectSource = 'Marketplace' | 'PlannerLibrary' | 'ClientUpload' | 'AiConcept';

export type MoodBoard = {
  id: string;
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
