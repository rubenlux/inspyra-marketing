import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProspectEstado, ProspectFuente, NivelOportunidad, DetectadoPor } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterProspectsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rubro?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({ enum: ProspectEstado })
  @IsOptional()
  @IsEnum(ProspectEstado)
  estado?: ProspectEstado;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: ProspectFuente })
  @IsOptional()
  @IsEnum(ProspectFuente)
  fuente?: ProspectFuente;

  @ApiPropertyOptional({ enum: NivelOportunidad })
  @IsOptional()
  @IsEnum(NivelOportunidad)
  nivelOportunidad?: NivelOportunidad;

  @ApiPropertyOptional({ enum: DetectadoPor })
  @IsOptional()
  @IsEnum(DetectadoPor)
  detectadoPor?: DetectadoPor;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scoreMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  scoreMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['score', 'createdAt'], default: 'score' })
  @IsOptional()
  @IsString()
  sortBy?: 'score' | 'createdAt';
}
