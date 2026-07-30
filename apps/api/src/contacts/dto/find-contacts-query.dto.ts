import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindContactsQueryDto {
  @ApiPropertyOptional({
    example: 'org-1',
    description: 'Organization id to list contacts for',
  })
  @IsUUID()
  organizationId: string;
}
