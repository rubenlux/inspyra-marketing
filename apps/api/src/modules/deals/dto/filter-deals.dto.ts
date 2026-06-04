import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DealEtapa, ServicioInteres, Temperatura } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterDealsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DealEtapa })
  @IsOptional()
  @IsEnum(DealEtapa)
  etapa?: DealEtapa;

  @ApiPropertyOptional({ enum: ServicioInteres })
  @IsOptional()
  @IsEnum(ServicioInteres)
  servicioInteres?: ServicioInteres;

  @ApiPropertyOptional({ enum: Temperatura })
  @IsOptional()
  @IsEnum(Temperatura)
  temperatura?: Temperatura;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter stalled deals only' })
  @IsOptional()
  estancada?: boolean;
}
