/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  CommercialAgreementStatus,
  ContractTemplateSourceType,
  ContractTemplateStatus,
} from '@prisma/client';
import { ContractsService } from './contracts.service';

describe('ContractsService', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const eventId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const workspaceId = '88888888-8888-8888-8888-888888888888';

  const prisma = {
    membership: { findUnique: jest.fn() },
    contractTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    commercialWorkspace: { findUnique: jest.fn() },
    supplier: { findUnique: jest.fn() },
    commercialAward: { findMany: jest.fn() },
    commercialAgreement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    commercialMessage: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  let service: ContractsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContractsService(prisma as never);
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
  });

  it('requires a private document reference for imported templates', async () => {
    await expect(
      service.createTemplate(userId, organizationId, {
        name: 'Imported supplier agreement',
        sourceType: ContractTemplateSourceType.Imported,
        importedFileName: 'supplier-agreement.docx',
        content:
          'Agreement between {{party_a_legal_name}} and {{party_b_name}}.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.contractTemplate.create).not.toHaveBeenCalled();
  });

  it('approves company wording without publishing or sending it', async () => {
    prisma.contractTemplate.findUnique.mockResolvedValue({
      id: 'template-1',
      organizationId,
      status: ContractTemplateStatus.Draft,
    });
    prisma.contractTemplate.update.mockResolvedValue({
      id: 'template-1',
      status: ContractTemplateStatus.Approved,
    });

    await service.approveTemplate(userId, organizationId, 'template-1');

    expect(prisma.contractTemplate.update).toHaveBeenCalledWith({
      where: { id: 'template-1' },
      data: {
        status: ContractTemplateStatus.Approved,
        approvedByUserId: userId,
        approvedAt: expect.any(Date),
      },
    });
    expect(prisma.commercialMessage.create).not.toHaveBeenCalled();
  });

  it('generates a private agreement snapshot from awarded commercial facts', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      organizationId,
      event: {
        id: eventId,
        title: 'Annual Dinner',
        eventDate: new Date('2027-09-05T08:00:00.000Z'),
        location: 'Sandton Convention Centre',
        venue: null,
        contact: null,
        organization: {
          id: organizationId,
          name: 'Planner Legal Entity',
          tradingName: 'Planner Co',
          registrationNumber: '2020/123456/07',
          vatNumber: '4123456789',
          physicalAddress: '1 Main Road',
        },
      },
    });
    prisma.contractTemplate.findUnique.mockResolvedValue({
      id: 'template-1',
      organizationId,
      status: ContractTemplateStatus.Approved,
      name: 'Supplier hire agreement',
      content:
        '{{party_a_legal_name}} appoints {{party_b_name}} for {{event_title}}.\n{{scope}}\nTotal: {{contract_total}}.',
    });
    prisma.supplier.findUnique.mockResolvedValue({
      id: 'supplier-1',
      organizationId,
      companyName: 'Furniture Hire Co',
      registrationNumber: '2019/999999/07',
      vatNumber: null,
      physicalAddress: '2 Supplier Street',
      preferredPaymentTerms: '50% deposit',
    });
    prisma.commercialAward.findMany.mockResolvedValue([
      {
        id: 'award-1',
        requirementItemId: 'requirement-1',
        quantity: 100,
        unitPrice: 25,
        lineTotal: 2500,
        commercialQuoteLine: {
          offeredDescription: 'Gold Tiffany chair',
          commercialQuote: {
            id: 'quote-1',
            currency: 'ZAR',
            paymentTerms: '50% deposit',
          },
        },
      },
    ]);
    prisma.commercialAgreement.create.mockResolvedValue({
      id: 'agreement-1',
      status: CommercialAgreementStatus.UnderReview,
    });
    prisma.commercialMessage.create.mockResolvedValue({ id: 'message-1' });

    await service.generateAgreement(userId, eventId, workspaceId, {
      templateId: 'template-1',
      supplierId: 'supplier-1',
    });

    expect(prisma.commercialAgreement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CommercialAgreementStatus.UnderReview,
          versions: {
            create: expect.objectContaining({
              version: 1,
              content: expect.stringContaining(
                'Planner Legal Entity appoints Furniture Hire Co',
              ),
              generatedByAi: false,
            }),
          },
        }),
      }),
    );
    expect(prisma.commercialMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        body: expect.stringContaining('nothing sent'),
      }),
    });
  });

  it('refuses to generate an agreement from unapproved wording', async () => {
    prisma.commercialWorkspace.findUnique.mockResolvedValue({
      id: workspaceId,
      eventId,
      organizationId,
      event: { organization: {}, contact: null },
    });
    prisma.contractTemplate.findUnique.mockResolvedValue({
      id: 'template-1',
      organizationId,
      status: ContractTemplateStatus.Draft,
    });

    await expect(
      service.generateAgreement(userId, eventId, workspaceId, {
        templateId: 'template-1',
        supplierId: 'supplier-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
