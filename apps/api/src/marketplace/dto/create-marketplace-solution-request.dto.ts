import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMarketplaceSolutionRequestDto {
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  supplierSlug!: string;

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

  @Transform(trim)
  @IsString()
  @MaxLength(200)
  requestTitle!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  serviceCategories!: string[];

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventType?: string;

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
  @IsInt()
  @Min(1)
  guestCount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetCents?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  desiredOutcomes?: string[];

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  scheduleNotes?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  accessNotes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];

  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  message!: string;
}
