import {
  AiDraftCapability,
  AiDraftFieldDecision,
  AiDraftInputType,
  AiDraftStatus,
} from '@prisma/client';

export type AiDraftSourceInput = {
  inputType: AiDraftInputType;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  contentText?: string | null;
  contentBase64?: string | null;
};

export type AiDraftFieldInput = {
  fieldPath: string;
  label: string;
  suggestedValue?: unknown;
  finalValue?: unknown;
  confidenceScore?: number | null;
  sourceReference?: string | null;
  decision?: AiDraftFieldDecision;
  isRequired?: boolean;
  lowConfidence?: boolean;
};

export type CreateAiDraftInput = {
  capability: AiDraftCapability;
  organizationId: string;
  status?: AiDraftStatus;
  extractionAdapter: string;
  draftPayload: unknown;
  approvedPayload?: unknown;
  warnings?: unknown;
  createdByUserId: string;
  sourceDocuments: AiDraftSourceInput[];
  extractedFields: AiDraftFieldInput[];
};

export type UpdateAiDraftInput = {
  status?: AiDraftStatus;
  draftPayload?: unknown;
  approvedPayload?: unknown;
  warnings?: unknown;
  committedTargetId?: string | null;
  committedAt?: Date | null;
  extractedFields?: AiDraftFieldInput[];
};
