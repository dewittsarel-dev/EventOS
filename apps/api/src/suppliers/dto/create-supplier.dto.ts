import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierCategory } from './supplier-category.enum';

const PHONE_PATTERN = /^[0-9+()\-\s]{7,40}$/;

function trimInput(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

function trimOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function normalizeWebsite(value: unknown) {
  const trimmed = trimOptionalString(value);

  if (typeof trimmed !== 'string') {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export class CreateSupplierDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Sunrise Catering Co.' })
  @Transform(({ value }) => trimInput(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  companyName: string;

  @ApiProperty({ enum: SupplierCategory, example: SupplierCategory.Catering })
  @IsEnum(SupplierCategory)
  category: SupplierCategory;

  @ApiPropertyOptional({ example: 'Maya Jacobs' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  primaryContactName?: string;

  @ApiPropertyOptional({ example: '+27 21 555 1234' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'phone must be a valid phone number',
  })
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: '+27 82 000 0000' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'mobile must be a valid phone number',
  })
  @MaxLength(40)
  mobile?: string;

  @ApiPropertyOptional({ example: 'hello@sunrise-catering.co.za' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: 'https://sunrise-catering.co.za' })
  @Transform(({ value }) => normalizeWebsite(value))
  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'website must be a valid website URL' },
  )
  @MaxLength(240)
  website?: string;

  @ApiPropertyOptional({ example: '12 Harbour Road, Foreshore' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(240)
  physicalAddress?: string;

  @ApiPropertyOptional({ example: 'Cape Town' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Western Cape' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  province?: string;

  @ApiPropertyOptional({ example: '8001' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: '4010123456' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vatNumber?: string;

  @ApiPropertyOptional({ example: '2019/123456/07' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(60)
  registrationNumber?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  preferredSupplier?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: '30 days EOM' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredPaymentTerms?: string;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  internalRating?: number;

  @ApiPropertyOptional({ example: 'Reliable for short-notice requests.' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
