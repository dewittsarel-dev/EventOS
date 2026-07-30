import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateOrganizationSettingsDto {
  @ApiProperty({
    example: 'EventOS Pty Ltd',
    description: 'Registered company name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  companyName: string;

  @ApiPropertyOptional({
    example: 'EventOS',
    description: 'Trading name used publicly',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tradingName?: string;

  @ApiPropertyOptional({
    example: 'VAT-12345',
    description: 'VAT registration number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vatNumber?: string;

  @ApiPropertyOptional({
    example: 'REG-98765',
    description: 'Company registration number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiProperty({
    example: 'hello@eventos.example',
    description: 'Primary business email',
  })
  @IsEmail()
  @MaxLength(200)
  email: string;

  @ApiPropertyOptional({
    example: '+27 11 555 0100',
    description: 'Business contact phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://eventos.example',
    description: 'Company website URL',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    example: '1 Harbour Road, Cape Town, South Africa',
    description: 'Physical business address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  physicalAddress?: string;

  @ApiPropertyOptional({
    example: 'PO Box 100, Cape Town, 8000',
    description: 'Postal address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  postalAddress?: string;
}
