import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommercialAgreementStatus,
  CommercialMessageAuthorRole,
  CommercialMessageType,
  ContractTemplateSourceType,
  ContractTemplateStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContractTemplateDto,
  GenerateCommercialAgreementDto,
} from './dto/contracts.dto';

const AGREEMENT_INCLUDE = {
  template: true,
  versions: { orderBy: { version: 'desc' as const } },
} as const;

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTemplate(
    userId: string,
    organizationId: string,
    dto: CreateContractTemplateDto,
  ) {
    await this.requireOrganizationAccess(userId, organizationId);
    if (
      dto.sourceType === ContractTemplateSourceType.Imported &&
      (!dto.importedFileName || !dto.importedFileReference)
    ) {
      throw new BadRequestException(
        'Imported templates require a private file name and reference',
      );
    }
    return this.prisma.contractTemplate.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        sourceType: dto.sourceType,
        importedFileName: dto.importedFileName?.trim(),
        importedFileReference: dto.importedFileReference?.trim(),
        content: dto.content,
        mergeFields: dto.mergeFields ?? this.extractMergeFields(dto.content),
        createdByUserId: userId,
      },
    });
  }

  async listTemplates(userId: string, organizationId: string) {
    await this.requireOrganizationAccess(userId, organizationId);
    return this.prisma.contractTemplate.findMany({
      where: { organizationId },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async approveTemplate(
    userId: string,
    organizationId: string,
    templateId: string,
  ) {
    await this.requireOrganizationAccess(userId, organizationId);
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template || template.organizationId !== organizationId) {
      throw new NotFoundException('Contract template not found');
    }
    if (template.status === ContractTemplateStatus.Archived) {
      throw new ConflictException('Archived templates cannot be approved');
    }
    return this.prisma.contractTemplate.update({
      where: { id: templateId },
      data: {
        status: ContractTemplateStatus.Approved,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
    });
  }

  async generateAgreement(
    userId: string,
    eventId: string,
    workspaceId: string,
    dto: GenerateCommercialAgreementDto,
  ) {
    const workspace = await this.requireWorkspaceAccess(
      userId,
      eventId,
      workspaceId,
    );
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id: dto.templateId },
    });
    if (
      !template ||
      template.organizationId !== workspace.organizationId ||
      template.status !== ContractTemplateStatus.Approved
    ) {
      throw new ConflictException(
        'An approved contract template from this organization is required',
      );
    }
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier || supplier.organizationId !== workspace.organizationId) {
      throw new NotFoundException('Supplier not found');
    }
    const awards = await this.prisma.commercialAward.findMany({
      where: { commercialWorkspaceId: workspaceId, supplierId: supplier.id },
      include: {
        commercialQuoteLine: { include: { commercialQuote: true } },
      },
      orderBy: { awardedAt: 'asc' },
    });
    if (awards.length === 0) {
      throw new ConflictException(
        'Awarded commercial lines are required before preparing an agreement',
      );
    }

    const event = workspace.event;
    const organization = event.organization;
    const quote = awards[awards.length - 1].commercialQuoteLine.commercialQuote;
    const total = awards.reduce((sum, award) => sum + award.lineTotal, 0);
    const scope = awards
      .map((award) => {
        const line = award.commercialQuoteLine;
        return `${line.offeredDescription}: ${award.quantity} x ${this.money(
          award.unitPrice,
          quote.currency,
        )} = ${this.money(award.lineTotal, quote.currency)}`;
      })
      .join('\n');
    const values: Record<string, string> = {
      party_a_legal_name: organization.name,
      party_a_trading_name: organization.tradingName ?? organization.name,
      party_a_registration_number:
        organization.registrationNumber ?? 'Not supplied',
      party_a_vat_number: organization.vatNumber ?? 'Not supplied',
      party_a_address: organization.physicalAddress ?? 'Not supplied',
      party_b_name: supplier.companyName,
      party_b_registration_number:
        supplier.registrationNumber ?? 'Not supplied',
      party_b_vat_number: supplier.vatNumber ?? 'Not supplied',
      party_b_address: supplier.physicalAddress ?? 'Not supplied',
      event_title: event.title,
      event_date: event.eventDate.toISOString().slice(0, 10),
      event_venue: event.location ?? event.venue ?? 'To be confirmed',
      currency: quote.currency,
      contract_total: this.money(total, quote.currency),
      scope,
      payment_terms:
        quote.paymentTerms ?? supplier.preferredPaymentTerms ?? 'To be agreed',
    };
    const renderedContent = this.renderTemplate(template.content, values);
    const partyASnapshot = {
      organizationId: organization.id,
      legalName: organization.name,
      tradingName: organization.tradingName,
      registrationNumber: organization.registrationNumber,
      vatNumber: organization.vatNumber,
      address: organization.physicalAddress,
    };
    const partyBSnapshot = {
      supplierId: supplier.id,
      companyName: supplier.companyName,
      registrationNumber: supplier.registrationNumber,
      vatNumber: supplier.vatNumber,
      address: supplier.physicalAddress,
    };
    const commercialSnapshot = {
      eventId,
      eventTitle: event.title,
      eventDate: event.eventDate,
      currency: quote.currency,
      total,
      paymentTerms: values.payment_terms,
      awardedLines: awards.map((award) => ({
        awardId: award.id,
        requirementItemId: award.requirementItemId,
        description: award.commercialQuoteLine.offeredDescription,
        quantity: award.quantity,
        unitPrice: award.unitPrice,
        lineTotal: award.lineTotal,
      })),
    };
    const title =
      dto.title?.trim() ?? `${event.title} - ${supplier.companyName} agreement`;

    return this.prisma.$transaction(async (tx) => {
      const agreement = await tx.commercialAgreement.create({
        data: {
          organizationId: workspace.organizationId,
          eventId,
          commercialWorkspaceId: workspaceId,
          templateId: template.id,
          counterpartyType: dto.counterpartyType?.trim() ?? 'Supplier',
          counterpartyId: supplier.id,
          counterpartyName: supplier.companyName,
          title,
          status: CommercialAgreementStatus.UnderReview,
          createdByUserId: userId,
          versions: {
            create: {
              version: 1,
              content: renderedContent,
              partyASnapshot: partyASnapshot,
              partyBSnapshot: partyBSnapshot,
              commercialSnapshot: commercialSnapshot,
              sourceReferences: {
                templateId: template.id,
                quoteId: quote.id,
                awardIds: awards.map((award) => award.id),
              },
              generatedByAi: false,
              createdByUserId: userId,
            },
          },
        },
        include: AGREEMENT_INCLUDE,
      });
      await tx.commercialMessage.create({
        data: {
          commercialWorkspaceId: workspaceId,
          supplierId: supplier.id,
          authorUserId: userId,
          authorRole: CommercialMessageAuthorRole.System,
          type: CommercialMessageType.SystemEvent,
          body: `Agreement draft prepared for ${supplier.companyName}. Human review required; nothing sent.`,
          metadata: { agreementId: agreement.id, status: agreement.status },
        },
      });
      return agreement;
    });
  }

  async listAgreements(userId: string, eventId: string, workspaceId: string) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    return this.prisma.commercialAgreement.findMany({
      where: { eventId, commercialWorkspaceId: workspaceId },
      orderBy: { updatedAt: 'desc' },
      include: AGREEMENT_INCLUDE,
    });
  }

  async approveAgreement(
    userId: string,
    eventId: string,
    workspaceId: string,
    agreementId: string,
  ) {
    await this.requireWorkspaceAccess(userId, eventId, workspaceId);
    const agreement = await this.prisma.commercialAgreement.findUnique({
      where: { id: agreementId },
    });
    if (
      !agreement ||
      agreement.eventId !== eventId ||
      agreement.commercialWorkspaceId !== workspaceId
    ) {
      throw new NotFoundException('Agreement not found');
    }
    if (
      agreement.status !== CommercialAgreementStatus.Draft &&
      agreement.status !== CommercialAgreementStatus.UnderReview
    ) {
      throw new ConflictException('Only draft agreements can be approved');
    }
    return this.prisma.$transaction(async (tx) => {
      const approved = await tx.commercialAgreement.update({
        where: { id: agreementId },
        data: {
          status: CommercialAgreementStatus.Approved,
          approvedByUserId: userId,
          approvedAt: new Date(),
        },
        include: AGREEMENT_INCLUDE,
      });
      await tx.commercialMessage.create({
        data: {
          commercialWorkspaceId: workspaceId,
          supplierId: agreement.counterpartyId,
          authorUserId: userId,
          authorRole: CommercialMessageAuthorRole.System,
          type: CommercialMessageType.SystemEvent,
          body: `Agreement approved for ${agreement.counterpartyName}. It has not been sent or signed.`,
          metadata: { agreementId, status: approved.status },
        },
      });
      return approved;
    });
  }

  private extractMergeFields(content: string): string[] {
    return [
      ...new Set(
        [...content.matchAll(/{{\s*([a-z0-9_]+)\s*}}/gi)].map(
          (match) => match[1],
        ),
      ),
    ];
  }

  private renderTemplate(
    content: string,
    values: Record<string, string>,
  ): string {
    return content.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_match, key) => {
      return values[String(key).toLowerCase()] ?? `{{${key}}}`;
    });
  }

  private money(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  private async requireOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) {
      throw new ForbiddenException('Organization access denied');
    }
    return membership;
  }

  private async requireWorkspaceAccess(
    userId: string,
    eventId: string,
    workspaceId: string,
  ) {
    const workspace = await this.prisma.commercialWorkspace.findUnique({
      where: { id: workspaceId },
      include: { event: { include: { organization: true, contact: true } } },
    });
    if (!workspace || workspace.eventId !== eventId) {
      throw new NotFoundException('Commercial Workspace not found');
    }
    await this.requireOrganizationAccess(userId, workspace.organizationId);
    return workspace;
  }
}
