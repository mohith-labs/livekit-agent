import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMcpServerDto {
  @IsString()
  name: string;

  @IsString()
  type: 'http' | 'stdio';

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  command?: string;

  @IsOptional()
  @IsArray()
  args?: string[];

  @IsOptional()
  env?: Record<string, string>;

  @IsOptional()
  headers?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateAgentDto {
  @IsString()
  name: string;

  @IsString()
  livekitUrl: string;

  @IsString()
  livekitApiKey: string;

  @IsString()
  livekitApiSecret: string;

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
