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

  @ApiProperty({
    example: '+27 82 111 2222',
    description: 'Contact mobile number',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile?: string;

  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Company or organization name',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @ApiProperty({
    example: 'Client',
    description: 'Contact category or type',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactType?: string;

  @ApiProperty({
    example: '123 Main Street, Cape Town',
    description: 'Contact address',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({
    example: 'Prefers WhatsApp contact during business hours.',
    description: 'Operational notes for this contact',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
