import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CompleteTaskDto {
  @ApiPropertyOptional({
    example: '2026-11-10T16:30:00.000Z',
    description: 'Optional explicit completion timestamp',
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
