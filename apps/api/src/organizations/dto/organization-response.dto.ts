import { ApiProperty } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({ example: 'org-1' })
  id: string;

  @ApiProperty({ example: 'EventOS' })
  name: string;

  @ApiProperty({ example: 'eventos' })
  slug: string;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  updatedAt: Date;
}

export class OrganizationListResponseDto {
  @ApiProperty({ type: [OrganizationResponseDto] })
  data: OrganizationResponseDto[];

  @ApiProperty({ example: { page: 1, limit: 10, total: 1 } })
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
