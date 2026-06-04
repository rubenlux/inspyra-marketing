import { IsString, IsOptional, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateResearchJobDto {
  @IsString()
  @MinLength(5, { message: 'La consulta debe tener al menos 5 caracteres' })
  @MaxLength(500)
  query: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
