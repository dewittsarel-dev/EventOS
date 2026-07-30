import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ORGANIZATION_USER_ROLE_VALUES } from './organization-user-role';

export class UpdateOrganizationUserDto {
  @ApiProperty({ example: 'Avery Stone', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: 'avery@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ enum: ORGANIZATION_USER_ROLE_VALUES, example: 'Manager' })
  @IsString()
  @IsIn(ORGANIZATION_USER_ROLE_VALUES)
  role: string;
}
