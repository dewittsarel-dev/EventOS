import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from './task-priority.enum';
import { TaskStatus } from './task-status.enum';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'event-1' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({ example: 'user-1', nullable: true })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string | null;

  @ApiPropertyOptional({ example: 'quote-1', nullable: true })
  @IsOptional()
  @IsUUID()
  quotationId?: string | null;

  @ApiPropertyOptional({ example: 'Updated task title' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated task details',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  description?: string | null;

  @ApiPropertyOptional({ example: '2026-11-11T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
