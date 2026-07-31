import { ApiProperty } from '@nestjs/swagger';
import {
  ROLE_PERMISSION_ACTIONS,
  ROLE_PERMISSION_GROUPS,
} from './permission-groups';

export class RoleResponseDto {
  @ApiProperty({ example: 'role-1' })
  id: string;

  @ApiProperty({ example: 'org-1' })
  organizationId: string;

  @ApiProperty({ example: 'Manager' })
  name: string;

  @ApiProperty({ example: 'Manages day-to-day execution and approvals.' })
  description: string;

  @ApiProperty({ example: 3 })
  userCount: number;

  @ApiProperty({ example: true })
  isSystem: boolean;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
    },
    example: {
      Dashboard: {
        View: true,
        Create: false,
        Edit: false,
        Delete: false,
      },
    },
  })
  permissions: Record<
    (typeof ROLE_PERMISSION_GROUPS)[number],
    Record<(typeof ROLE_PERMISSION_ACTIONS)[number], boolean>
  >;
}

export class RoleListResponseDto {
  @ApiProperty({ type: [RoleResponseDto] })
  data: RoleResponseDto[];
}
