import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDeliverableDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaEsperada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
