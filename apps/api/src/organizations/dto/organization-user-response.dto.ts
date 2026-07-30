import { ApiProperty } from '@nestjs/swagger';
import { ORGANIZATION_USER_ROLE_VALUES } from './organization-user-role';

export class OrganizationUserResponseDto {
  @ApiProperty({ example: 'membership-1' })
  membershipId: string;

  @ApiProperty({ example: 'user-1' })
  userId: string;

  @ApiProperty({ example: 'Avery Stone', nullable: true })
  name: string | null;

  @ApiProperty({ example: 'avery@example.com' })
  email: string;

  @ApiProperty({ enum: ORGANIZATION_USER_ROLE_VALUES, example: 'Manager' })
  role: string;

  @ApiProperty({ example: 'Active', enum: ['Active', 'Disabled'] })
  status: 'Active' | 'Disabled';

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;
}

export class OrganizationUserListResponseDto {
  @ApiProperty({ type: [OrganizationUserResponseDto] })
  data: OrganizationUserResponseDto[];
}
