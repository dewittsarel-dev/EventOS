import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { MeetingType } from './meeting-note-type.enum';

export enum MeetingSortOrder {
  Newest = 'newest',
  Oldest = 'oldest',
  Upcoming = 'upcoming',
}

export class FindMeetingNotesQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ example: 'planning' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({ enum: MeetingType })
  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: MeetingSortOrder })
  @IsOptional()
  @IsEnum(MeetingSortOrder)
  sort?: MeetingSortOrder;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
