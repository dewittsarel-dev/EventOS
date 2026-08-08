import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierCategory } from './supplier-category.enum';

const PHONE_PATTERN = /^[0-9+()\-\s]{7,40}$/;

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

export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'Sunrise Catering Co.' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @ApiPropertyOptional({
    enum: SupplierCategory,
    example: SupplierCategory.Catering,
  })
  @IsOptional()
  @IsEnum(SupplierCategory)
  category?: SupplierCategory;

  @ApiPropertyOptional({ example: 'Maya Jacobs', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  primaryContactName?: string | null;

  @ApiPropertyOptional({ example: '+27 21 555 1234', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'phone must be a valid phone number',
  })
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ example: '+27 82 000 0000', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'mobile must be a valid phone number',
  })
  @MaxLength(40)
  mobile?: string | null;

  @ApiPropertyOptional({
    example: 'hello@sunrise-catering.co.za',
    nullable: true,
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string | null;

  @ApiPropertyOptional({
    example: 'https://sunrise-catering.co.za',
    nullable: true,
  })
  @Transform(({ value }) => normalizeWebsite(value))
  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'website must be a valid website URL' },
  )
  @MaxLength(240)
  website?: string | null;

  @ApiPropertyOptional({
    example: '12 Harbour Road, Foreshore',
    nullable: true,
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(240)
  physicalAddress?: string | null;

  @ApiPropertyOptional({ example: 'Cape Town', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @ApiPropertyOptional({ example: 'Western Cape', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  province?: string | null;

  @ApiPropertyOptional({ example: '8001', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiPropertyOptional({ example: '4010123456', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vatNumber?: string | null;

  @ApiPropertyOptional({ example: '2019/123456/07', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(60)
  registrationNumber?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  preferredSupplier?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: '30 days EOM', nullable: true })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredPaymentTerms?: string | null;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  internalRating?: number | null;

  @ApiPropertyOptional({
    example: 'Reliable for short-notice requests.',
    nullable: true,
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
