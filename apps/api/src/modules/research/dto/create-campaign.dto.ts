import {
  IsString, IsOptional, IsArray, IsInt, IsIn,
  Min, Max, ArrayMinSize, MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  fromTemplate?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  strategyPrompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'servicesToSell requires at least 1 service' })
  servicesToSell?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMarkets?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetIndustries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  problemSignals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opportunitySignals?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  threshold?: number;

  @IsOptional()
  @IsString()
  @IsIn(['MANUAL'], { message: 'DiscoveryCampaign currently supports MANUAL mode only' })
  automationLevel?: string;

  @IsOptional()
  @IsString()
  @IsIn(['WEB_SEARCH', 'GOOGLE_PLACES', 'HAIKU_GENERATED', 'DIRECTORY_SCRAPE'])
  preferredSource?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  defaultLimit?: number;
}
