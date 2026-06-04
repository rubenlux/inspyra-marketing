import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsNumber, IsObject, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentRunsService } from './agent-runs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

class StartRunDto {
  @ApiProperty() @IsString() agentId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() triggeredBy?: 'HUMAN' | 'SUPERVISOR' | 'HEARTBEAT' | 'WEBHOOK';
  @ApiPropertyOptional() @IsOptional() @IsString() inputSummary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inputHash?: string;
}

class TokensDto {
  @IsString() provider: string;
  @IsString() model: string;
  @IsNumber() @Min(0) inputTokens: number;
  @IsNumber() @Min(0) outputTokens: number;
  @IsOptional() @IsNumber() costUsd?: number;
}

class ErrorDto {
  @IsString() errorCode: string;
  @IsString() errorMessage: string;
  @IsOptional() @IsString() toolName?: string;
}

class EndRunDto {
  @ApiProperty({ enum: ['COMPLETED', 'FAILED', 'CANCELLED'] })
  @IsEnum(['COMPLETED', 'FAILED', 'CANCELLED'])
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional() @IsOptional() @IsString() outputSummary?: string;
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => TokensDto) tokens?: TokensDto;
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => ErrorDto) error?: ErrorDto;
}

@ApiTags('Agent Runs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent-runs')
export class AgentRunsController {
  constructor(private readonly service: AgentRunsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start an agent run and get a runId for tracking' })
  start(@Body() dto: StartRunDto, @CurrentUser() user: JwtPayload) {
    return this.service.start(user.tenantId, dto);
  }

  @Patch(':runId/end')
  @ApiOperation({ summary: 'End an agent run with status, output and token usage' })
  end(@Param('runId') runId: string, @Body() dto: EndRunDto, @CurrentUser() user: JwtPayload) {
    return this.service.end(user.tenantId, runId, dto);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get aggregated metrics for all agent runs' })
  metrics(@Query('agentId') agentId: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.service.getMetrics(user.tenantId, agentId);
  }
}
