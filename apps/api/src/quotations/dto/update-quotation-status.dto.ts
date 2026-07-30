import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { QuotationStatus } from './quotation-status.enum';

export class UpdateQuotationStatusDto {
  @ApiProperty({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  status: QuotationStatus;
}
