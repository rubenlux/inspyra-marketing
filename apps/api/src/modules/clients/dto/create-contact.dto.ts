import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
