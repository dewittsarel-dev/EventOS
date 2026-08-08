import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class OverrideRequirementDto {
  @ApiProperty({ example: 'R-001' })
  @IsString()
  @MaxLength(20)
  requirementCode: string;

  @ApiProperty({ example: 58, minimum: 0 })
  @IsNumber()
  @Min(0)
  quantityRequired: number;

  @ApiProperty({ example: 'VIP table layout' })
  @IsString()
  @MaxLength(1000)
  reason: string;
}
