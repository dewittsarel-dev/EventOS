import {
  ConflictException,
  Injectable,
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
