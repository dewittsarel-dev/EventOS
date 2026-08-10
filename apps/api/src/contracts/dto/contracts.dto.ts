import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractTemplateSourceType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateContractTemplateDto {
  @ApiProperty({ example: 'Standard supplier hire agreement' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ContractTemplateSourceType })
  @IsEnum(ContractTemplateSourceType)
  sourceType!: ContractTemplateSourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  importedFileName?: string;

  @ApiPropertyOptional({
    description: 'Private document-store reference; never a public URL',
  })
  @IsOptional()
  @IsString()
  importedFileReference?: string;

  @ApiProperty({
    description: 'Template wording with optional {{merge_field}} placeholders',
  })
  @IsString()
  @MinLength(20)
  content!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mergeFields?: string[];
}

export class GenerateCommercialAgreementDto {
  @ApiProperty()
  @IsString()
  templateId!: string;

  @ApiProperty()
  @IsString()
  supplierId!: string;

  @ApiPropertyOptional({ example: 'Supplier' })
  @IsOptional()
  @IsString()
  counterpartyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}
