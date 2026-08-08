import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class ClientBriefAttachmentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsUrl({ require_tld: false })
  url: string;
}

export class CreateClientBriefVersionDto {
  @ApiProperty({ example: 'Lara Croft' })
  @IsString()
  @MaxLength(200)
  clientName: string;

  @ApiProperty({ example: 'Wedding Reception' })
  @IsString()
  @MaxLength(200)
  eventName: string;

  @ApiProperty({ type: [String], example: ['2026-12-01'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsDateString({}, { each: true })
  eventDates: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  venue?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedGuests?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  dressCode?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  eventType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  clientObjectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  initialRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ type: [ClientBriefAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientBriefAttachmentDto)
  attachments?: ClientBriefAttachmentDto[];
}
