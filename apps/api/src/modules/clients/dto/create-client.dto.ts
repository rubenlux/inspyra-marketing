import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BillingCycle, EstadoCuenta } from '@prisma/client';

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  razonSocial: string;

  @ApiProperty()
  @IsString()
  nombreComercial: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cuitIdentificacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty()
  @IsUUID()
  accountOwnerId: string;

  @ApiPropertyOptional({ enum: EstadoCuenta })
  @IsOptional()
  @IsEnum(EstadoCuenta)
  estadoCuenta?: EstadoCuenta;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dealOrigenId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  comercialCierreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  ticketInicialUsd?: number;

  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  feeMensualUsd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dominio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  sslExpiraAt?: string;
}
