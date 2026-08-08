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
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMarketplaceEnquiryDto {
  @IsUUID()
  resourceId!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(160)
  customerName!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  customerEmail!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  eventDate?: Date;

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

  @Transform(trim)
  @IsString()
  @MaxLength(3000)
  message!: string;
}
