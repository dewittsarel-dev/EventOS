import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateContactDto) {
    await this.ensureOrganizationAccess(userId, data.organizationId);

    return this.prisma.contact.create({
      data: {
        organizationId: data.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        companyName: data.companyName,
        contactType: data.contactType,
        address: data.address,
        notes: data.notes,
      },
    });
  }

  async findAll(userId: string, organizationId: string) {
    await this.ensureOrganizationAccess(userId, organizationId);

    const data = await this.prisma.contact.findMany({
      where: {
        organizationId,
        archivedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data };
  }

  async findOne(userId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        events: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            status: true,
          },
          orderBy: {
            eventDate: 'desc',
          },
        },
        quotations: {
          select: {
            id: true,
            quoteNumber: true,
            title: true,
            status: true,
            totalCents: true,
            eventId: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, contact.organizationId);

    const eventIds = contact.events.map((event) => event.id);
    const quotationIds = contact.quotations.map((quotation) => quotation.id);

    const meetingNoteWhere: Prisma.MeetingNoteWhereInput = {
      organizationId: contact.organizationId,
    };

    if (eventIds.length > 0) {
      meetingNoteWhere.eventId = { in: eventIds };
    } else {
      meetingNoteWhere.id = { in: [] };
    }

    const meetingNotes = await this.prisma.meetingNote.findMany({
      where: meetingNoteWhere,
      select: {
        id: true,
        title: true,
        meetingDate: true,
        meetingType: true,
        eventId: true,
      },
      orderBy: {
        meetingDate: 'desc',
      },
    });

    const taskWhere: Prisma.TaskWhereInput = {
      organizationId: contact.organizationId,
      archivedAt: null,
      OR: [],
    };

    if (eventIds.length > 0) {
      taskWhere.OR?.push({ eventId: { in: eventIds } });
    }

    if (quotationIds.length > 0) {
      taskWhere.OR?.push({ quotationId: { in: quotationIds } });
    }

    const tasks =
      taskWhere.OR && taskWhere.OR.length > 0
        ? await this.prisma.task.findMany({
            where: taskWhere,
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              eventId: true,
              quotationId: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        : [];

    return {
      ...contact,
      organizationName: contact.organization.name,
      meetingNotes,
      tasks,
    };
  }

  async update(userId: string, id: string, data: UpdateContactDto) {
    const contact = await this.findOne(userId, id);

    return this.prisma.contact.update({
      where: { id: contact.id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const contact = await this.findOne(userId, id);

    await this.prisma.contact.delete({ where: { id: contact.id } });
  }

  async archive(userId: string, id: string) {
    const contact = await this.findOne(userId, id);

    return this.prisma.contact.update({
      where: { id: contact.id },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  private async ensureOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }
}
