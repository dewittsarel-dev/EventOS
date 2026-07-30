import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({
    example: 'Lara',
    description: 'Contact first name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Croft',
    description: 'Contact last name',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional({
    example: 'lara@example.com',
    description: 'Contact email',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    example: '+27 82 000 0000',
    description: 'Contact phone number',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;
}
