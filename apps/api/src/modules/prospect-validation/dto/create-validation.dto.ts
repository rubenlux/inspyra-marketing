import { IsArray, IsDecimal, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Prioridad } from '@prisma/client';

export class CreateValidationDto {
  @IsUUID()
  prospectId: string;

  @IsInt()
  @Min(0)
  @Max(100)
  agentScore: number;

  @IsArray()
  @IsString({ each: true })
  servicesRecommended: string[];

  @IsOptional()
  estimatedTicketUsd?: number;

  @IsEnum(Prioridad)
  prioridad: Prioridad;

  @IsOptional()
  @IsString()
  reasoning?: string;
}
