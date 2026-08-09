/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  MoodBoardObjectSource,
  MoodBoardReviewType,
  MoodBoardStatus,
  RequirementSetStatus,
} from '@prisma/client';
import { MoodBoardsService } from './mood-boards.service';

describe('MoodBoardsService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const setId = '55555555-5555-5555-5555-555555555555';
  const itemId = '66666666-6666-6666-6666-666666666666';
  const boardId = '77777777-7777-7777-7777-777777777777';

  const prisma = {
    event: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
    requirementSet: { findUnique: jest.fn() },
    moodBoard: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    moodBoardScene: { create: jest.fn() },
    moodBoardObject: { create: jest.fn() },
    moodBoardReview: { create: jest.fn() },
    moodBoardRenderRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const marketplaceObject = {
    requirementItemId: itemId,
    name: 'Gold Tiffany Chair',
    source: MoodBoardObjectSource.Marketplace,
    sourceReferenceId: 'MP-00458',
    supplierName: 'ABC Events',
    marketplaceListingId: 'MP-00458',
    imageUrl: 'https://images.test/chair.jpg',
    locked: true,
    sortOrder: 0,
  };

  let service: MoodBoardsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MoodBoardsService(prisma as never);
    prisma.event.findUnique.mockResolvedValue({ id: eventId, organizationId });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.requirementSet.findUnique.mockResolvedValue({
      id: setId,
      eventId,
      eventDesignVersionId: 'design-1',
      status: RequirementSetStatus.Approved,
      items: [{ id: itemId, requirementCode: 'R-001' }],
    });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('creates Mood Board V1 with traceable requirement-linked objects', async () => {
    prisma.moodBoard.findFirst.mockResolvedValue(null);
    prisma.moodBoard.create.mockResolvedValue({ id: boardId });
    prisma.moodBoardScene.create.mockResolvedValue({ id: 'scene-1' });
    prisma.moodBoardObject.create.mockResolvedValue({ id: 'object-1' });
    prisma.moodBoard.findUniqueOrThrow.mockResolvedValue({
      id: boardId,
      version: 1,
    });

    const result = await service.create(userId, eventId, {
      requirementSetId: setId,
      title: 'Wedding Visual Concept',
      scenes: [
        {
          sceneKey: 'main-hall',
          name: 'Main Hall',
          objects: [marketplaceObject],
        },
      ],
    });

    expect(result).toEqual(expect.objectContaining({ version: 1 }));
    expect(prisma.moodBoard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventDesignVersionId: 'design-1',
        requirementSetId: setId,
        version: 1,
      }),
    });
    expect(prisma.moodBoardObject.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requirementItemId: itemId,
        objectKey: 'OBJ-001',
        source: MoodBoardObjectSource.Marketplace,
        marketplaceListingId: 'MP-00458',
      }),
    });
  });

  it('rejects an object that is not linked to the selected Requirement Set', async () => {
    await expect(
      service.create(userId, eventId, {
        requirementSetId: setId,
        title: 'Invalid Board',
        scenes: [
          {
            sceneKey: 'stage',
            name: 'Stage',
            objects: [
              {
                ...marketplaceObject,
                requirementItemId: '99999999-9999-9999-9999-999999999999',
              },
            ],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents a revision from changing a locked object', async () => {
    prisma.moodBoard.findUnique.mockResolvedValue({
      id: boardId,
      eventId,
      scenes: [
        {
          sceneKey: 'main-hall',
          objects: [
            {
              ...marketplaceObject,
              id: 'object-1',
              moodBoardSceneId: 'scene-1',
              objectKey: 'OBJ-001',
              supplierName: 'ABC Events',
              marketplaceListingId: 'MP-00458',
              presentation: null,
              requirementItem: { requirementCode: 'R-001' },
              createdAt: new Date(),
            },
          ],
        },
      ],
      reviews: [],
    });

    await expect(
      service.create(userId, eventId, {
        requirementSetId: setId,
        basedOnMoodBoardId: boardId,
        title: 'Wedding Visual Concept V2',
        scenes: [
          {
            sceneKey: 'main-hall',
            name: 'Main Hall',
            objects: [
              {
                ...marketplaceObject,
                objectKey: 'OBJ-001',
                imageUrl: 'https://images.test/changed-chair.jpg',
              },
            ],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.moodBoard.create).not.toHaveBeenCalled();
  });

  it('records client approval without triggering procurement', async () => {
    prisma.moodBoard.findUnique.mockResolvedValue({
      id: boardId,
      eventId,
      status: MoodBoardStatus.InClientReview,
    });
    prisma.moodBoard.update.mockResolvedValue({
      id: boardId,
      status: MoodBoardStatus.Approved,
    });

    await service.approve(userId, eventId, boardId);

    expect(prisma.moodBoardReview.create).toHaveBeenCalledWith({
      data: {
        moodBoardId: boardId,
        reviewerUserId: userId,
        type: MoodBoardReviewType.Approval,
      },
    });
    expect(prisma.moodBoard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: MoodBoardStatus.Approved,
          approvedByUserId: userId,
        }),
      }),
    );
  });

  it('compares versions and flags requirement review without updating procurement', async () => {
    const baseObject = {
      ...marketplaceObject,
      id: 'object-1',
      moodBoardSceneId: 'scene-1',
      objectKey: 'OBJ-001',
      presentation: null,
      requirementItem: { requirementCode: 'R-001' },
      createdAt: new Date(),
    };
    prisma.moodBoard.findUnique
      .mockResolvedValueOnce({
        id: 'board-v1',
        eventId,
        version: 1,
        scenes: [{ objects: [baseObject] }],
        reviews: [],
      })
      .mockResolvedValueOnce({
        id: 'board-v2',
        eventId,
        version: 2,
        scenes: [
          {
            objects: [
              {
                ...baseObject,
                name: 'Clear Ghost Chair',
                sourceReferenceId: 'MP-00999',
              },
            ],
          },
        ],
        reviews: [],
      });

    const result = await service.compare(
      userId,
      eventId,
      'board-v1',
      'board-v2',
    );

    expect(result.changes).toHaveLength(1);
    expect(result.affectedRequirementItemIds).toEqual([itemId]);
    expect(result.requiresRequirementImpactReview).toBe(true);
    expect(result.procurementUpdated).toBe(false);
  });

  it('prepares a provider-neutral scene render request with locked-object governance', async () => {
    const sceneId = '88888888-8888-8888-8888-888888888888';
    prisma.moodBoard.findUnique.mockResolvedValue({
      id: boardId,
      eventId,
      version: 2,
      status: MoodBoardStatus.Draft,
      scenes: [
        {
          id: sceneId,
          sceneKey: 'main-hall',
          name: 'Main Hall',
          description: 'Three long rows',
          objects: [
            {
              ...marketplaceObject,
              objectKey: 'OBJ-001',
              presentation: { placementInstructions: 'Ten per table' },
              requirementItem: {
                id: itemId,
                requirementCode: 'R-001',
                name: 'Chairs',
                quantityRequired: 100,
                unit: 'Each',
              },
            },
          ],
        },
      ],
    });
    prisma.moodBoardRenderRequest.create.mockResolvedValue({
      id: 'render-1',
      status: 'Prepared',
    });

    await service.prepareRenderRequest(userId, eventId, boardId, {
      sceneId,
      prompt: 'Create a realistic reception layout',
    });

    expect(prisma.moodBoardRenderRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          moodBoardId: boardId,
          sceneId,
          inputPayload: expect.objectContaining({
            governance: {
              preserveLockedObjects: true,
              providerSubmissionAuthorised: false,
              commercialCommitmentAuthorised: false,
            },
          }),
        }),
      }),
    );
  });

  it('blocks render preparation while a board is in client review', async () => {
    prisma.moodBoard.findUnique.mockResolvedValue({
      id: boardId,
      eventId,
      status: MoodBoardStatus.InClientReview,
      scenes: [],
    });
    await expect(
      service.prepareRenderRequest(userId, eventId, boardId, {
        sceneId: '88888888-8888-8888-8888-888888888888',
        prompt: 'Change the flowers',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.moodBoardRenderRequest.create).not.toHaveBeenCalled();
  });
});
