import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DealEtapa, MotivoPerdida } from '@prisma/client';

export class MoveStageDto {
  @ApiProperty({ enum: DealEtapa })
  @IsEnum(DealEtapa)
  etapa: DealEtapa;

  @ApiPropertyOptional({ enum: MotivoPerdida, description: 'Required when moving to PERDIDO' })
  @IsOptional()
  @IsEnum(MotivoPerdida)
  motivoPerdida?: MotivoPerdida;

  @ApiPropertyOptional({ description: 'Required when motivoPerdida is OTRO' })
  @IsOptional()
  @IsString()
  notaCierre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;
}
