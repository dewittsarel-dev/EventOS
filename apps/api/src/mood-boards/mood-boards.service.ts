import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MoodBoardObjectSource,
  MoodBoardReviewType,
  MoodBoardStatus,
  Prisma,
  RequirementSetStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMoodBoardDto,
  MoodBoardObjectDto,
  MoodBoardReviewDto,
} from './dto/mood-board.dto';

const FULL_BOARD_INCLUDE = {
  scenes: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      objects: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          requirementItem: { select: { requirementCode: true } },
        },
      },
    },
  },
  reviews: { orderBy: { createdAt: 'asc' as const } },
} as const;

type FullMoodBoard = Prisma.MoodBoardGetPayload<{
  include: typeof FULL_BOARD_INCLUDE;
}>;
type FullMoodBoardObject = FullMoodBoard['scenes'][number]['objects'][number];
type MoodBoardChange = {
  objectKey: string;
  change: 'Added' | 'Removed' | 'Changed';
  before?: FullMoodBoardObject;
  after?: FullMoodBoardObject;
};

@Injectable()
export class MoodBoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, eventId: string, dto: CreateMoodBoardDto) {
    const event = await this.requireEventAccess(userId, eventId);
    const requirementSet = await this.prisma.requirementSet.findUnique({
      where: { id: dto.requirementSetId },
      include: { items: { select: { id: true, requirementCode: true } } },
    });
    if (!requirementSet || requirementSet.eventId !== eventId) {
      throw new BadRequestException(
        'Requirement Set does not belong to this event',
      );
    }
    if (requirementSet.status !== RequirementSetStatus.Approved) {
      throw new ConflictException(
        'Mood Boards require an approved Requirement Set',
      );
    }

    const itemIds = new Set(requirementSet.items.map((item) => item.id));
    const requirementCodes = new Map(
      requirementSet.items.map((item) => [item.id, item.requirementCode]),
    );
    const suppliedObjectKeys = dto.scenes.flatMap((scene) =>
      scene.objects.flatMap((object) =>
        object.objectKey ? [object.objectKey] : [],
      ),
    );
    if (new Set(suppliedObjectKeys).size !== suppliedObjectKeys.length) {
      throw new BadRequestException('Mood Board object keys must be unique');
    }
    for (const scene of dto.scenes) {
      for (const object of scene.objects) {
        if (!itemIds.has(object.requirementItemId)) {
          throw new BadRequestException(
            'Every Mood Board object must link to this Requirement Set',
          );
        }
        if (
          object.source === MoodBoardObjectSource.Marketplace &&
          (!object.marketplaceListingId || !object.supplierName)
        ) {
          throw new BadRequestException(
            'Marketplace objects require supplierName and marketplaceListingId',
          );
        }
      }
    }

    const previous = dto.basedOnMoodBoardId
      ? await this.prisma.moodBoard.findUnique({
          where: { id: dto.basedOnMoodBoardId },
          include: FULL_BOARD_INCLUDE,
        })
      : null;
    if (dto.basedOnMoodBoardId && (!previous || previous.eventId !== eventId)) {
      throw new BadRequestException(
        'Previous Mood Board version does not belong to this event',
      );
    }
    if (previous) {
      this.validateLockedObjects(previous, dto, requirementCodes);
    }

    return this.prisma.$transaction(
      async (tx) => {
        const latest = await tx.moodBoard.findFirst({
          where: { eventId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        const version = (latest?.version ?? 0) + 1;
        const board = await tx.moodBoard.create({
          data: {
            organizationId: event.organizationId,
            eventId,
            eventDesignVersionId: requirementSet.eventDesignVersionId,
            requirementSetId: requirementSet.id,
            basedOnMoodBoardId: previous?.id,
            version,
            title: dto.title,
            createdByUserId: userId,
          },
        });

        let nextObjectNumber = Math.max(
          0,
          ...suppliedObjectKeys.map((key) =>
            Number.parseInt(key.replace('OBJ-', ''), 10),
          ),
        );
        for (const sceneInput of dto.scenes) {
          const scene = await tx.moodBoardScene.create({
            data: {
              moodBoardId: board.id,
              sceneKey: sceneInput.sceneKey,
              name: sceneInput.name,
              description: sceneInput.description,
              sortOrder: sceneInput.sortOrder ?? 0,
            },
          });
          for (const object of sceneInput.objects) {
            if (!object.objectKey) nextObjectNumber += 1;
            await tx.moodBoardObject.create({
              data: {
                moodBoardSceneId: scene.id,
                requirementItemId: object.requirementItemId,
                objectKey:
                  object.objectKey ??
                  `OBJ-${String(nextObjectNumber).padStart(3, '0')}`,
                name: object.name,
                source: object.source,
                sourceReferenceId: object.sourceReferenceId,
                supplierName: object.supplierName,
                marketplaceListingId: object.marketplaceListingId,
                imageUrl: object.imageUrl,
                locked: object.locked ?? false,
                presentation: object.presentation as
                  Prisma.InputJsonValue | undefined,
                sortOrder: object.sortOrder ?? 0,
              },
            });
          }
        }
        return tx.moodBoard.findUniqueOrThrow({
          where: { id: board.id },
          include: FULL_BOARD_INCLUDE,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async list(userId: string, eventId: string) {
    await this.requireEventAccess(userId, eventId);
    return this.prisma.moodBoard.findMany({
      where: { eventId },
      orderBy: { version: 'desc' },
      include: FULL_BOARD_INCLUDE,
    });
  }

  async submitForReview(userId: string, eventId: string, boardId: string) {
    await this.requireEventAccess(userId, eventId);
    const board = await this.requireBoard(eventId, boardId);
    if (
      board.status !== MoodBoardStatus.Draft &&
      board.status !== MoodBoardStatus.ChangesRequested
    ) {
      throw new ConflictException('Only a draft board can enter client review');
    }
    return this.prisma.moodBoard.update({
      where: { id: boardId },
      data: { status: MoodBoardStatus.InClientReview, submittedAt: new Date() },
      include: FULL_BOARD_INCLUDE,
    });
  }

  async comment(
    userId: string,
    eventId: string,
    boardId: string,
    dto: MoodBoardReviewDto,
  ) {
    await this.requireReviewableBoard(userId, eventId, boardId);
    return this.prisma.moodBoardReview.create({
      data: {
        moodBoardId: boardId,
        reviewerUserId: userId,
        type: MoodBoardReviewType.Comment,
        comment: dto.comment,
      },
    });
  }

  async requestChanges(
    userId: string,
    eventId: string,
    boardId: string,
    dto: MoodBoardReviewDto,
  ) {
    await this.requireReviewableBoard(userId, eventId, boardId);
    return this.prisma.$transaction(async (tx) => {
      await tx.moodBoardReview.create({
        data: {
          moodBoardId: boardId,
          reviewerUserId: userId,
          type: MoodBoardReviewType.ChangeRequest,
          comment: dto.comment,
        },
      });
      return tx.moodBoard.update({
        where: { id: boardId },
        data: { status: MoodBoardStatus.ChangesRequested },
        include: FULL_BOARD_INCLUDE,
      });
    });
  }

  async approve(userId: string, eventId: string, boardId: string) {
    await this.requireReviewableBoard(userId, eventId, boardId);
    return this.prisma.$transaction(async (tx) => {
      await tx.moodBoardReview.create({
        data: {
          moodBoardId: boardId,
          reviewerUserId: userId,
          type: MoodBoardReviewType.Approval,
        },
      });
      return tx.moodBoard.update({
        where: { id: boardId },
        data: {
          status: MoodBoardStatus.Approved,
          approvedByUserId: userId,
          approvedAt: new Date(),
        },
        include: FULL_BOARD_INCLUDE,
      });
    });
  }

  async compare(
    userId: string,
    eventId: string,
    fromBoardId: string,
    toBoardId: string,
  ) {
    await this.requireEventAccess(userId, eventId);
    const [from, to] = await Promise.all([
      this.prisma.moodBoard.findUnique({
        where: { id: fromBoardId },
        include: FULL_BOARD_INCLUDE,
      }),
      this.prisma.moodBoard.findUnique({
        where: { id: toBoardId },
        include: FULL_BOARD_INCLUDE,
      }),
    ]);
    if (!from || !to || from.eventId !== eventId || to.eventId !== eventId) {
      throw new NotFoundException('Mood Board version not found');
    }
    const fromObjects = this.flattenObjects(from);
    const toObjects = this.flattenObjects(to);
    const keys = new Set([...fromObjects.keys(), ...toObjects.keys()]);
    const changes: MoodBoardChange[] = [];
    for (const key of keys) {
      const before = fromObjects.get(key);
      const after = toObjects.get(key);
      if (!before && after) {
        changes.push({ objectKey: key, change: 'Added', after });
      } else if (before && !after) {
        changes.push({ objectKey: key, change: 'Removed', before });
      } else if (
        before &&
        after &&
        this.objectSignature(before) !== this.objectSignature(after)
      ) {
        changes.push({ objectKey: key, change: 'Changed', before, after });
      }
    }
    return {
      fromVersion: from.version,
      toVersion: to.version,
      changes,
      affectedRequirementItemIds: [
        ...new Set(
          changes
            .flatMap((change) => [
              change.before?.requirementItemId,
              change.after?.requirementItemId,
            ])
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      requiresRequirementImpactReview: changes.length > 0,
      procurementUpdated: false,
    };
  }

  private validateLockedObjects(
    previous: FullMoodBoard,
    dto: CreateMoodBoardDto,
    requirementCodes: Map<string, string>,
  ) {
    const proposed = new Map(
      dto.scenes.flatMap((scene) =>
        scene.objects
          .filter((object) => object.objectKey)
          .map((object) => [
            object.objectKey!,
            { sceneKey: scene.sceneKey, object },
          ]),
      ),
    );
    for (const scene of previous.scenes) {
      for (const object of scene.objects) {
        if (!object.locked) continue;
        const next = proposed.get(object.objectKey);
        if (
          !next ||
          next.sceneKey !== scene.sceneKey ||
          this.dtoObjectSignature(
            next.object,
            requirementCodes.get(next.object.requirementItemId)!,
          ) !== this.objectSignature(object)
        ) {
          throw new ConflictException(
            `Locked object ${object.objectKey} cannot be changed or removed`,
          );
        }
      }
    }
  }

  private flattenObjects(board: FullMoodBoard) {
    return new Map(
      board.scenes.flatMap((scene) =>
        scene.objects.map((object) => [object.objectKey, object] as const),
      ),
    );
  }

  private objectSignature(object: FullMoodBoardObject) {
    return JSON.stringify({
      requirementCode: object.requirementItem.requirementCode,
      name: object.name,
      source: object.source,
      sourceReferenceId: object.sourceReferenceId,
      supplierName: object.supplierName,
      marketplaceListingId: object.marketplaceListingId,
      imageUrl: object.imageUrl,
      locked: object.locked,
      presentation: object.presentation,
      sortOrder: object.sortOrder,
    });
  }

  private dtoObjectSignature(
    object: MoodBoardObjectDto,
    requirementCode: string,
  ) {
    return JSON.stringify({
      requirementCode,
      name: object.name,
      source: object.source,
      sourceReferenceId: object.sourceReferenceId,
      supplierName: object.supplierName ?? null,
      marketplaceListingId: object.marketplaceListingId ?? null,
      imageUrl: object.imageUrl,
      locked: object.locked ?? false,
      presentation: object.presentation ?? null,
      sortOrder: object.sortOrder ?? 0,
    });
  }

  private async requireReviewableBoard(
    userId: string,
    eventId: string,
    boardId: string,
  ) {
    await this.requireEventAccess(userId, eventId);
    const board = await this.requireBoard(eventId, boardId);
    if (board.status !== MoodBoardStatus.InClientReview) {
      throw new ConflictException('Mood Board is not in client review');
    }
    return board;
  }

  private async requireBoard(eventId: string, boardId: string) {
    const board = await this.prisma.moodBoard.findUnique({
      where: { id: boardId },
      select: { id: true, eventId: true, status: true },
    });
    if (!board || board.eventId !== eventId) {
      throw new NotFoundException('Mood Board not found');
    }
    return board;
  }

  private async requireEventAccess(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizationId: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: event.organizationId },
      },
      select: { id: true },
    });
    if (!membership)
      throw new ForbiddenException('You do not have access to this event');
    return event;
  }
}
