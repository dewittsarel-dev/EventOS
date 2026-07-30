import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateOrganizationLogoDto {
  @ApiProperty({
    example: 'https://cdn.example.com/eventos-logo.png',
    description: 'Logo URL placeholder until upload flow is implemented',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  logoUrl: string;
}
