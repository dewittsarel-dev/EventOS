import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class PrepareMoodBoardRenderDto {
  @ApiProperty()
  @IsUUID()
  sceneId: string;

  @ApiProperty({
    description: 'Planner-requested visual change or composition instruction',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  prompt: string;
}
