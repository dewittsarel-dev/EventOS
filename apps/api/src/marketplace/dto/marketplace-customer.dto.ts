import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  MarketplaceDiscoveryPath,
  MarketplaceEventConceptStatus,
} from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class MarketplaceCustomerRegisterDto {
  @Transform(trim) @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(10) @MaxLength(128) password: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(160) name: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

export class MarketplaceCustomerLoginDto {
  @Transform(trim) @IsEmail() @MaxLength(254) email: string;
  @IsString() @MaxLength(128) password: string;
}

export class MarketplaceCustomerEnquiryDto {
  @IsUUID() resourceId: string;
  @Type(() => Date) @IsOptional() @IsDate() eventDate?: Date;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  eventLocation?: string;
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  quantity?: number;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(3000) message: string;
}

export class MarketplaceShortlistDto {
  @IsUUID() resourceId: string;
}

export class MarketplaceEnquiryMessageDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(3000) body: string;
}

export class MarketplaceEventConceptCreateDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(160) title: string;
}

export class MarketplaceEventConceptUpdateDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;
  @IsOptional()
  @IsEnum(MarketplaceEventConceptStatus)
  status?: MarketplaceEventConceptStatus;
  @IsOptional()
  @IsEnum(MarketplaceDiscoveryPath)
  lastDiscoveryPath?: MarketplaceDiscoveryPath;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  assistantBrief?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) eventType?: string;
  @Type(() => Date) @IsOptional() @IsDate() eventDate?: Date;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) guestCount?: number;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  venueStatus?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(160) venueName?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) city?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) area?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(0) travelRadiusKm?: number;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(80) setting?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) theme?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) style?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) colours?: string[];
  @Type(() => Number) @IsOptional() @IsInt() @Min(0) budgetCents?: number;
  @IsOptional() @IsBoolean() allowSubstitutions?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) requirements?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) searchTerms?: string[];
}

export class MarketplaceEventConceptSelectionDto {
  @IsUUID() resourceId: string;
  @IsEnum(MarketplaceDiscoveryPath) discoveryPath: MarketplaceDiscoveryPath;
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  quantity?: number;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
