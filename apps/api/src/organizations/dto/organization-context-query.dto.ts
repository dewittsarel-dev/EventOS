import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class OrganizationContextQueryDto {
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Organization id selected in the active workspace',
  })
  @IsUUID()
  organizationId: string;
}
