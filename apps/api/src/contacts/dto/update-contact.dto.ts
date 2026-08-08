import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({
    example: 'Lara',
    description: 'Contact first name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Croft',
    description: 'Contact last name',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional({
    example: 'lara@example.com',
    description: 'Contact email',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    example: '+27 82 000 0000',
    description: 'Contact phone number',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @ApiPropertyOptional({
    example: '+27 82 111 2222',
    description: 'Contact mobile number',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile?: string | null;

  @ApiPropertyOptional({
    example: 'Acme Corporation',
    description: 'Company or organization name',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string | null;

  @ApiPropertyOptional({
    example: 'Client',
    description: 'Contact category or type',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactType?: string | null;

  @ApiPropertyOptional({
    example: '123 Main Street, Cape Town',
    description: 'Contact address',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional({
    example: 'Prefers WhatsApp contact during business hours.',
    description: 'Operational notes for this contact',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;
}
