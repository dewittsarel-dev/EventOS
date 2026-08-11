import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSupplierCatalogueImportDto {
  @IsUUID()
  organizationId!: string;

  @IsArray()
  sourceFiles!: unknown[];

  @IsArray()
  candidates!: unknown[];

  @IsOptional()
  @IsString()
  extractionAdapter?: string;
}

export class UpdateSupplierCatalogueImportDto {
  @IsUUID()
  organizationId!: string;

  @IsOptional()
  @IsArray()
  sourceFiles?: unknown[];

  @IsOptional()
  @IsArray()
  candidates?: unknown[];

  @IsOptional()
  @IsIn(['Review', 'Completed', 'Cancelled'])
  status?: 'Review' | 'Completed' | 'Cancelled';
}
