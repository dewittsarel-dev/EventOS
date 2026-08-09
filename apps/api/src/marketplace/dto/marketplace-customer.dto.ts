import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class MarketplaceCustomerRegisterDto {
  @Transform(trim) @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(10) @MaxLength(128) password: string;
  @Transform(trim) @IsString() @MaxLength(160) name: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

export class MarketplaceCustomerLoginDto {
  @Transform(trim) @IsEmail() email: string;
  @IsString() password: string;
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
  @Transform(trim) @IsString() @MaxLength(3000) message: string;
}

export class MarketplaceShortlistDto {
  @IsUUID() resourceId: string;
}

export class MarketplaceEnquiryMessageDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(3000) body: string;
}
