import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Field Coordinator' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'Coordinates field execution tasks and updates progress.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
    },
  })
  @IsObject()
  permissions: Record<string, Record<string, boolean>>;
}
