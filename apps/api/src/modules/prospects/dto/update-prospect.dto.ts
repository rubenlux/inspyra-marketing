import { PartialType } from '@nestjs/swagger';
import { CreateProspectDto } from './create-prospect.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ProspectEstado } from '@prisma/client';

export class UpdateProspectDto extends PartialType(CreateProspectDto) {
  @ApiPropertyOptional({ enum: ProspectEstado })
  @IsOptional()
  @IsEnum(ProspectEstado)
  estado?: ProspectEstado;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ultimoContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proximoSeguimiento?: string;
}
