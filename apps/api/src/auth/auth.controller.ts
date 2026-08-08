import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  AuthResponseDto,
  DevelopmentSeedResponseDto,
  RegisterResponseDto,
  UserResponseDto,
  WorkspaceContextResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    description: 'User account created successfully',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiConflictResponse({ description: 'Email already in use' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Log in with an email and password' })
  @ApiOkResponse({
    description: 'Authentication succeeded',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({
    description: 'Authenticated user profile',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getMe(@CurrentUser() user: UserResponseDto) {
    return user;
  }

  @Get('workspace')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get authenticated user and accessible organizations',
  })
  @ApiOkResponse({
    description: 'Workspace context for the current user',
    type: WorkspaceContextResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getWorkspace(@CurrentUser() user: UserResponseDto) {
    return this.authService.getWorkspaceContext(user.id);
  }

  @Post('development-seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Create or update deterministic development auth seed data (development mode only)',
  })
  @ApiOkResponse({
    description: 'Development user and organization seed result',
    type: DevelopmentSeedResponseDto,
  })
  seedDevelopmentWorkspace() {
    return this.authService.seedDevelopmentWorkspace();
  }
}
