import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMcpServerDto } from './create-agent.dto';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  livekitUrl?: string;

  @IsOptional()
  @IsString()
  livekitApiKey?: string;

  @IsOptional()
  @IsString()
  livekitApiSecret?: string;

  @IsOptional()
  @IsString()
  openaiModel?: string;

  @IsOptional()
  @IsString()
  voice?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  webSearchEnabled?: boolean;

  @IsOptional()
  @IsString()
  webSearchApiKey?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMcpServerDto)
  mcpServers?: CreateMcpServerDto[];
}
