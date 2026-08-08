import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventDesignStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientBriefVersionDto } from './dto/create-client-brief-version.dto';
import { CreateEventDesignVersionDto } from './dto/create-event-design-version.dto';

@Injectable()
export class EventDesignService {
  constructor(private readonly prisma: PrismaService) {}

  async createClientBriefVersion(
    userId: string,
    eventId: string,
    dto: CreateClientBriefVersionDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);

    return this.prisma.$transaction(
      async (tx) => {
        const latest = await tx.clientBriefVersion.findFirst({
          where: { eventId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        return tx.clientBriefVersion.create({
          data: {
            organizationId: event.organizationId,
            eventId,
            version: (latest?.version ?? 0) + 1,
            clientName: dto.clientName,
            eventName: dto.eventName,
            eventDates: dto.eventDates.map((date) => new Date(date)),
            venue: dto.venue,
            expectedGuests: dto.expectedGuests,
            budgetCents: dto.budgetCents,
            dressCode: dto.dressCode,
            eventType: dto.eventType,
            clientObjectives: dto.clientObjectives,
            initialRequirements: dto.initialRequirements,
            notes: dto.notes,
            attachments: dto.attachments as Prisma.InputJsonValue | undefined,
            createdByUserId: userId,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listClientBriefVersions(userId: string, eventId: string) {
    await this.requireEventAccess(userId, eventId);
    return this.prisma.clientBriefVersion.findMany({
      where: { eventId },
      orderBy: { version: 'desc' },
    });
  }

  async createEventDesignVersion(
    userId: string,
    eventId: string,
    dto: CreateEventDesignVersionDto,
  ) {
    const event = await this.requireEventAccess(userId, eventId);
    const brief = await this.prisma.clientBriefVersion.findUnique({
      where: { id: dto.clientBriefVersionId },
    });

    if (!brief || brief.eventId !== eventId) {
      throw new BadRequestException(
        'Client Brief version does not belong to this event',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const latest = await tx.eventDesignVersion.findFirst({
          where: { eventId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        return tx.eventDesignVersion.create({
          data: {
            organizationId: event.organizationId,
            eventId,
            clientBriefVersionId: dto.clientBriefVersionId,
            version: (latest?.version ?? 0) + 1,
            seating: dto.seating as Prisma.InputJsonValue | undefined,
            decor: dto.decor as Prisma.InputJsonValue | undefined,
            catering: dto.catering as Prisma.InputJsonValue | undefined,
            entertainment: dto.entertainment as
              Prisma.InputJsonValue | undefined,
            lightingAndAv: dto.lightingAndAv as
              Prisma.InputJsonValue | undefined,
            branding: dto.branding as Prisma.InputJsonValue | undefined,
            infrastructure: dto.infrastructure as
              Prisma.InputJsonValue | undefined,
            staffing: dto.staffing as Prisma.InputJsonValue | undefined,
            createdByUserId: userId,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listEventDesignVersions(userId: string, eventId: string) {
    await this.requireEventAccess(userId, eventId);
    return this.prisma.eventDesignVersion.findMany({
      where: { eventId },
      orderBy: { version: 'desc' },
      include: { clientBriefVersion: true },
    });
  }

  async approveEventDesignVersion(
    userId: string,
    eventId: string,
    designId: string,
  ) {
    await this.requireEventAccess(userId, eventId);
    const design = await this.prisma.eventDesignVersion.findUnique({
      where: { id: designId },
    });

    if (!design || design.eventId !== eventId) {
      throw new NotFoundException('Event Design version not found');
    }
    if (design.status === EventDesignStatus.Approved) {
      throw new ConflictException('Event Design version is already approved');
    }

    return this.prisma.eventDesignVersion.update({
      where: { id: designId },
      data: {
        status: EventDesignStatus.Approved,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
    });
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
    if (!membership) {
      throw new ForbiddenException('You do not have access to this event');
    }
    return event;
  }
}
