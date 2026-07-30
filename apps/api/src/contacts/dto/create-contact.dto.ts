import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    example: 'org-1',
    description: 'Organization id that owns this contact',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    example: 'Lara',
    description: 'Contact first name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    example: 'Croft',
    description: 'Contact last name',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    example: 'lara@example.com',
    description: 'Contact email',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+27 82 000 0000',
    description: 'Contact phone number',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}
