import { ApiProperty } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty({ example: 'contact-1' })
  id: string;

  @ApiProperty({ example: 'org-1' })
  organizationId: string;

  @ApiProperty({ example: 'Lara' })
  firstName: string;

  @ApiProperty({ example: 'Croft', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'lara@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+27 82 000 0000', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;
}

export class ContactListResponseDto {
  @ApiProperty({ type: ContactResponseDto, isArray: true })
  data: ContactResponseDto[];
}
