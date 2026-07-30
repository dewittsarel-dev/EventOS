import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      },
    });
  }

  async findAll(userId: string, organizationId: string) {
    await this.ensureOrganizationAccess(userId, organizationId);

    const data = await this.prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return { data };
  }

  async findOne(userId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundException(`Contact with id ${id} not found`);
    }

    await this.ensureOrganizationAccess(userId, contact.organizationId);

    return contact;
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
