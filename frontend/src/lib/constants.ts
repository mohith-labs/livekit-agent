export const OPENAI_MODELS = [
  { value: 'gpt-4o-realtime-preview', label: 'GPT-4o Realtime Preview' },
  { value: 'gpt-4o-mini-realtime-preview', label: 'GPT-4o Mini Realtime Preview' },
  { value: 'gpt-realtime', label: 'GPT Realtime (Latest)' },
];

export const VOICES = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral, balanced' },
  { value: 'ash', label: 'Ash', description: 'Warm, gentle' },
  { value: 'ballad', label: 'Ballad', description: 'Expressive, dramatic' },
  { value: 'coral', label: 'Coral', description: 'Clear, friendly' },
  { value: 'echo', label: 'Echo', description: 'Smooth, resonant' },
  { value: 'fable', label: 'Fable', description: 'Story-like, engaging' },
  { value: 'marin', label: 'Marin', description: 'Bright, confident' },
  { value: 'nova', label: 'Nova', description: 'Energetic, lively' },
  { value: 'onyx', label: 'Onyx', description: 'Deep, authoritative' },
  { value: 'sage', label: 'Sage', description: 'Calm, wise' },
  { value: 'shimmer', label: 'Shimmer', description: 'Light, cheerful' },
  { value: 'verse', label: 'Verse', description: 'Poetic, melodic' },
];

export type AgentStatus = 'running' | 'stopped' | 'error';

export interface McpServerConfig {
  id?: string;
  name: string;
  type: 'http' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  enabled: boolean;
}

export interface AgentConfig {
  id?: string;
  name: string;
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  openaiModel: string;
  voice: string;
  instructions: string;
  webSearchEnabled: boolean;
  webSearchApiKey?: string;
  mcpServers: McpServerConfig[];
  status?: AgentStatus;
  createdAt?: string;
  updatedAt?: string;
}
