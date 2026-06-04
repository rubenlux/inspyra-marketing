import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ServicioCategoria, BillingModel } from '@prisma/client';

export class CreateCatalogItemDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty({ enum: ServicioCategoria })
  @IsEnum(ServicioCategoria)
  categoria: ServicioCategoria;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcionDefault?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  precioBaseUsd: number;

  @ApiProperty({ enum: BillingModel })
  @IsEnum(BillingModel)
  billingModelDefault: BillingModel;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
