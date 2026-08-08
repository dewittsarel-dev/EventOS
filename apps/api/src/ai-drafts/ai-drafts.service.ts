import { Injectable, NotFoundException } from '@nestjs/common';
import { AiDraftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AiDraftFieldInput,
  CreateAiDraftInput,
  UpdateAiDraftInput,
} from './ai-drafts.types';

@Injectable()
export class AiDraftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAiDraftInput) {
    return this.prisma.aiDraft.create({
      data: {
        capability: input.capability,
        organizationId: input.organizationId,
        status: input.status ?? AiDraftStatus.ReviewPending,
        extractionAdapter: input.extractionAdapter,
        draftPayload: this.toJsonValue(input.draftPayload),
        approvedPayload: this.toNullableJsonValue(input.approvedPayload),
        warnings: this.toNullableJsonValue(input.warnings),
        createdByUserId: input.createdByUserId,
        sourceDocuments: {
          create: input.sourceDocuments.map((source) => ({
            inputType: source.inputType,
            fileName: source.fileName ?? null,
            mimeType: source.mimeType ?? null,
            sizeBytes: source.sizeBytes ?? null,
            contentText: source.contentText ?? null,
            contentBase64: source.contentBase64 ?? null,
          })),
        },
        extractedFields: {
          create: input.extractedFields.map((field) =>
            this.mapFieldCreate(field),
          ),
        },
      },
      include: this.includeDraft,
    });
  }

  async findById(id: string) {
    const draft = await this.prisma.aiDraft.findUnique({
      where: { id },
      include: this.includeDraft,
    });

    if (!draft) {
      throw new NotFoundException(`Draft with id ${id} not found`);
    }

    return draft;
  }

  async update(id: string, input: UpdateAiDraftInput) {
    return this.prisma.$transaction(async (tx) => {
      await tx.aiDraft.update({
        where: { id },
        data: {
          status: input.status,
          draftPayload:
            input.draftPayload === undefined
              ? undefined
              : this.toJsonValue(input.draftPayload),
          approvedPayload:
            input.approvedPayload === undefined
              ? undefined
              : this.toNullableJsonValue(input.approvedPayload),
          warnings:
            input.warnings === undefined
              ? undefined
              : this.toNullableJsonValue(input.warnings),
          committedTargetId:
            input.committedTargetId === undefined
              ? undefined
              : input.committedTargetId,
          committedAt:
            input.committedAt === undefined ? undefined : input.committedAt,
        },
      });

      if (input.extractedFields) {
        await tx.aiDraftExtractedField.deleteMany({
          where: { draftId: id },
        });

        if (input.extractedFields.length > 0) {
          await tx.aiDraftExtractedField.createMany({
            data: input.extractedFields.map((field) =>
              this.mapFieldCreateWithDraftId(field, id),
            ),
          });
        }
      }

      const draft = await tx.aiDraft.findUnique({
        where: { id },
        include: this.includeDraft,
      });

      if (!draft) {
        throw new NotFoundException(`Draft with id ${id} not found`);
      }

      return draft;
    });
  }

  private readonly includeDraft = {
    sourceDocuments: {
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    extractedFields: {
      orderBy: {
        fieldPath: 'asc' as const,
      },
    },
  } as const;

  private mapFieldCreate(field: AiDraftFieldInput, draftId?: string) {
    return {
      ...(draftId ? { draftId } : {}),
      fieldPath: field.fieldPath,
      label: field.label,
      suggestedValue: this.toNullableJsonValue(field.suggestedValue),
      finalValue: this.toNullableJsonValue(field.finalValue),
      confidenceScore: field.confidenceScore ?? null,
      sourceReference: field.sourceReference ?? null,
      decision: field.decision,
      isRequired: field.isRequired ?? false,
      lowConfidence: field.lowConfidence ?? false,
    };
  }

  private mapFieldCreateWithDraftId(field: AiDraftFieldInput, draftId: string) {
    return {
      draftId,
      fieldPath: field.fieldPath,
      label: field.label,
      suggestedValue: this.toNullableJsonValue(field.suggestedValue),
      finalValue: this.toNullableJsonValue(field.finalValue),
      confidenceScore: field.confidenceScore ?? null,
      sourceReference: field.sourceReference ?? null,
      decision: field.decision,
      isRequired: field.isRequired ?? false,
      lowConfidence: field.lowConfidence ?? false,
    };
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private toNullableJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return value;
  }
}
