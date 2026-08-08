import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'user-1' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Example User', nullable: true })
  name: string | null;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  updatedAt: Date;
}

export class WorkspaceOrganizationResponseDto {
  @ApiProperty({ example: 'org-1' })
  id: string;

  @ApiProperty({ example: 'EventOS Pty Ltd' })
  name: string;

  @ApiProperty({ example: 'eventos' })
  slug: string;
}

export class WorkspaceContextResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: [WorkspaceOrganizationResponseDto] })
  organizations: WorkspaceOrganizationResponseDto[];
}

export class RegisterResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class DevelopmentSeedResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: WorkspaceOrganizationResponseDto })
  organization: WorkspaceOrganizationResponseDto;

  @ApiProperty({ type: [WorkspaceOrganizationResponseDto] })
  organizations: WorkspaceOrganizationResponseDto[];

  @ApiProperty({ example: 'org-1' })
  organizationId: string;

  @ApiProperty({ example: 'administrator' })
  membershipRole: string;
}
