import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateEventDesignVersionDto {
  @ApiProperty({ description: 'Client Brief version used by this design' })
  @IsUUID()
  clientBriefVersionId: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  seating?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  decor?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  catering?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  entertainment?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  lightingAndAv?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  infrastructure?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  staffing?: Record<string, unknown>;
}
