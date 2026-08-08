import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly developmentUserEmail = 'demo@eventos.local';

  private readonly developmentUserPassword = 'Demo123!ChangeMe';

  private readonly developmentUserName = 'Demo Administrator';

  private readonly developmentOrganizationName = 'EventOS Demo Organization';

  private readonly developmentOrganizationSlug = 'eventos-demo-organization';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const normalizedEmail = this.normalizeEmail(registerDto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    let createdUser: {
      id: string;
      email: string;
      name: string | null;
      createdAt: Date;
      updatedAt: Date;
      passwordHash: string | null;
    };

    try {
      createdUser = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
        },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string' &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }

    return {
      user: this.toPublicUser(createdUser),
    };
  }

  async login(loginDto: LoginDto) {
    const normalizedEmail = this.normalizeEmail(loginDto.email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: this.issueAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: this.getAccessTokenTtlSeconds(),
      user: this.toPublicUser(user),
    };
  }

  async getAuthenticatedUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return this.toPublicUser(user);
  }

  async getWorkspaceContext(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        isDisabled: false,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      user: this.toPublicUser(user),
      organizations: memberships.map((membership) => membership.organization),
    };
  }

  async seedDevelopmentWorkspace() {
    if (!this.isDevelopmentMode()) {
      throw new NotFoundException('Not found');
    }

    const workspace = await this.prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(this.developmentUserPassword, 12);

      const user = await tx.user.upsert({
        where: {
          email: this.developmentUserEmail,
        },
        create: {
          email: this.developmentUserEmail,
          name: this.developmentUserName,
          passwordHash,
        },
        update: {
          name: this.developmentUserName,
          passwordHash,
        },
      });

      const organization = await tx.organization.upsert({
        where: {
          slug: this.developmentOrganizationSlug,
        },
        create: {
          name: this.developmentOrganizationName,
          slug: this.developmentOrganizationSlug,
        },
        update: {
          name: this.developmentOrganizationName,
        },
      });

      await tx.membership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          },
        },
        create: {
          userId: user.id,
          organizationId: organization.id,
          role: 'administrator',
          isDisabled: false,
        },
        update: {
          role: 'administrator',
          isDisabled: false,
        },
      });

      return {
        user,
        organization,
      };
    });

    return {
      accessToken: this.issueAccessToken(workspace.user),
      tokenType: 'Bearer',
      expiresIn: this.getAccessTokenTtlSeconds(),
      user: this.toPublicUser(workspace.user),
      organization: {
        id: workspace.organization.id,
        name: workspace.organization.name,
        slug: workspace.organization.slug,
      },
      organizations: [
        {
          id: workspace.organization.id,
          name: workspace.organization.name,
          slug: workspace.organization.slug,
        },
      ],
      organizationId: workspace.organization.id,
      membershipRole: 'administrator',
    };
  }

  private isDevelopmentMode() {
    return process.env.NODE_ENV !== 'production';
  }

  private issueAccessToken(user: { id: string; email: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.getAccessTokenTtlSeconds(),
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private getAccessTokenTtlSeconds() {
    const ttl = this.configService.get<string>('app.jwtAccessTokenTtl', '15m');

    if (ttl.endsWith('m')) {
      return Number.parseInt(ttl.slice(0, -1), 10) * 60;
    }

    if (ttl.endsWith('h')) {
      return Number.parseInt(ttl.slice(0, -1), 10) * 3600;
    }

    if (ttl.endsWith('s')) {
      return Number.parseInt(ttl.slice(0, -1), 10);
    }

    return Number.parseInt(ttl, 10);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    passwordHash?: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
