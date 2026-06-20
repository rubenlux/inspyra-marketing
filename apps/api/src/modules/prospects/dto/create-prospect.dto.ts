import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  Max,
  Min,
} from 'class-validator';
import {
  TamanoEmpresa,
  NivelOportunidad,
  Prioridad,
  ProspectFuente,
  DetectadoPor,
  ProspectEstado,
} from '@prisma/client';

export class CreateProspectDto {
  @ApiProperty()
  @IsString()
  nombreEmpresa: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombreContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rubro?: string;

  @ApiPropertyOptional({ enum: TamanoEmpresa })
  @IsOptional()
  @IsEnum(TamanoEmpresa)
  tamanoEmpresa?: TamanoEmpresa;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  empleadosEstimado?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleBusiness?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oportunidadDetectada?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  problemasEncontrados?: string[];

  @ApiPropertyOptional({ enum: NivelOportunidad })
  @IsOptional()
  @IsEnum(NivelOportunidad)
  nivelOportunidad?: NivelOportunidad;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  servicioSugerido?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ enum: Prioridad })
  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: ProspectFuente })
  @IsOptional()
  @IsEnum(ProspectFuente)
  fuente?: ProspectFuente;

  @ApiPropertyOptional({ enum: DetectadoPor })
  @IsOptional()
  @IsEnum(DetectadoPor)
  detectadoPor?: DetectadoPor;

  @ApiPropertyOptional({ enum: ProspectEstado })
  @IsOptional()
  @IsEnum(ProspectEstado)
  estado?: ProspectEstado;
}
