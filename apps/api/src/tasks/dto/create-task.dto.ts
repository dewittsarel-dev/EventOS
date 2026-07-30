import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from './task-priority.enum';
import { TaskStatus } from './task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'org-1' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ example: 'event-1' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({ example: 'user-1', nullable: true })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({
    example: 'quote-1',
    nullable: true,
    description: 'Future-ready relation to quotation',
  })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @ApiProperty({ example: 'Confirm florist logistics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({
    example: 'Ensure setup is complete by 14:00.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  description?: string;

  @ApiPropertyOptional({ example: '2026-11-10T12:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.Medium })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
