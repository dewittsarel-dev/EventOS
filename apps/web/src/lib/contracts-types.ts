export type ContractTemplateSourceType = 'Designed' | 'Imported';
export type ContractTemplateStatus = 'Draft' | 'Approved' | 'Archived';
export type CommercialAgreementStatus =
  | 'Draft'
  | 'UnderReview'
  | 'Approved'
  | 'Sent'
  | 'PartiallySigned'
  | 'Executed'
  | 'Superseded'
  | 'Cancelled';

export type ContractTemplate = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  sourceType: ContractTemplateSourceType;
  status: ContractTemplateStatus;
  importedFileName: string | null;
  importedFileReference: string | null;
  content: string;
  mergeFields: string[];
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommercialAgreementVersion = {
  id: string;
  version: number;
  content: string;
  generatedByAi: boolean;
  createdAt: string;
};

export type CommercialAgreement = {
  id: string;
  title: string;
  counterpartyType: string;
  counterpartyId: string | null;
  counterpartyName: string;
  status: CommercialAgreementStatus;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: ContractTemplate;
  versions: CommercialAgreementVersion[];
};
