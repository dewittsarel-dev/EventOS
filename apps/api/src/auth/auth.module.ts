import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

function getAccessTokenTtlSeconds(ttl: string) {
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

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('app.jwtSecret');

        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: getAccessTokenTtlSeconds(
              configService.get<string>('app.jwtAccessTokenTtl', '15m'),
            ),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
