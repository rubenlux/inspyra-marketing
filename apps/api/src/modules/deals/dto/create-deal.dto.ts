import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsNumber,
} from 'class-validator';
import { ServicioInteres, DealFuente, Temperatura, Urgencia } from '@prisma/client';

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  empresa: string;

  @ApiProperty()
  @IsString()
  contactoNombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactoEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactoTelefono?: string;

  @ApiProperty({ enum: ServicioInteres })
  @IsEnum(ServicioInteres)
  servicioInteres: ServicioInteres;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorEstimadoUsd?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probabilidadCierre?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaEstimadaCierre?: string;

  @ApiProperty()
  @IsUUID()
  ownerId: string;

  @ApiPropertyOptional({ enum: DealFuente })
  @IsOptional()
  @IsEnum(DealFuente)
  fuenteOrigen?: DealFuente;

  @ApiPropertyOptional({ enum: Temperatura })
  @IsOptional()
  @IsEnum(Temperatura)
  temperatura?: Temperatura;

  @ApiPropertyOptional({ enum: Urgencia })
  @IsOptional()
  @IsEnum(Urgencia)
  urgencia?: Urgencia;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proximaAccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proximaAccionAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notasInternas?: string;
}
