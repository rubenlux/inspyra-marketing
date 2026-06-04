import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

class PricingItemDto {
  @ApiProperty() @IsUUID() catalogItemId: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) cantidad?: number = 1;
}

class CalculatePricingDto {
  @ApiProperty({ type: [PricingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingItemDto)
  items: PricingItemDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() bundle?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(50) descuentoManual?: number;
}

@ApiTags('Pricing Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate exact prices for a set of catalog services' })
  calculate(@Body() dto: CalculatePricingDto, @CurrentUser() user: JwtPayload) {
    return this.service.calculate(user.tenantId, dto);
  }
}
