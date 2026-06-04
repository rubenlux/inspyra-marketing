import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ServicioCategoria, BillingModel } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty({ enum: ServicioCategoria })
  @IsEnum(ServicioCategoria)
  categoria: ServicioCategoria;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcionAlcance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  duracionEstimadaDias?: number;

  @ApiProperty({ enum: BillingModel })
  @IsEnum(BillingModel)
  billingModel: BillingModel;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  precioVendidoUsd: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioActualUsd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costeInternoUsd?: number;

  @ApiProperty()
  @IsUUID()
  ownerId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  equipoIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entregables?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sla?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  renovacionAutomatica?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proximaRenovacionAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dealOrigenId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}
