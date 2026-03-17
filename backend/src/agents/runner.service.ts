import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildProcess, fork } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Agent } from './entities/agent.entity';

interface AgentProcess {
  process: ChildProcess;
  status: 'running' | 'stopped' | 'error';
  error?: string;
}

@Injectable()
export class RunnerService implements OnModuleDestroy {
  private readonly logger = new Logger(RunnerService.name);
  private processes = new Map<string, AgentProcess>();
  private readonly templateDir: string;

  constructor(private configService: ConfigService) {
    this.templateDir = path.join(process.cwd(), 'agent-runners');
    if (!fs.existsSync(this.templateDir)) {
      fs.mkdirSync(this.templateDir, { recursive: true });
    }
  }

  onModuleDestroy() {
    for (const [id] of this.processes) {
      this.stop(id).catch(() => {});
    }
  }

  getStatus(agentId: string): 'running' | 'stopped' | 'error' {
    const proc = this.processes.get(agentId);
    return proc?.status || 'stopped';
  }

  getError(agentId: string): string | undefined {
    return this.processes.get(agentId)?.error;
  }

  async start(agent: Agent): Promise<void> {
    const existing = this.processes.get(agent.id);
    if (existing?.status === 'running') {
      this.logger.warn(`Agent ${agent.name} is already running`);
      return;
    }

    const scriptPath = this.generateAgentScript(agent);

    const tokenUrl = this.configService.get('OPEN_AI_TOKEN_URL', '');

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      LIVEKIT_URL: agent.livekitUrl,
      LIVEKIT_API_KEY: agent.livekitApiKey,
      LIVEKIT_API_SECRET: agent.livekitApiSecret,
      OPEN_AI_TOKEN_URL: tokenUrl,
      // Placeholder so the openai plugin does not throw at import time.
      // The real per-session key is fetched inside the entry() function.
      OPENAI_API_KEY: 'placeholder-replaced-per-session',
      AGENT_CONFIG: JSON.stringify({
        id: agent.id,
        name: agent.name,
        openaiModel: agent.openaiModel,
        voice: agent.voice,
        instructions: agent.instructions,
        webSearchEnabled: agent.webSearchEnabled,
        webSearchApiKey: agent.webSearchApiKey || '',
        mcpServers: (agent.mcpServers || [])
          .filter((m) => m.enabled)
          .map((m) => ({
            name: m.name,
            type: m.type,
            url: m.url,
            command: m.command,
            args: m.args,
            env: m.env,
            headers: m.headers,
          })),
      }),
    };

    try {
      const child = fork(scriptPath, ['dev'], {
        env,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        execArgv: [],
      });

      child.stdout?.on('data', (data: Buffer) => {
        this.logger.log(`[${agent.name}] ${data.toString().trim()}`);
      });

      child.stderr?.on('data', (data: Buffer) => {
        this.logger.error(`[${agent.name}] ${data.toString().trim()}`);
      });

      child.on('exit', (code, signal) => {
        this.logger.log(`Agent ${agent.name} exited with code ${code}, signal ${signal}`);
        const proc = this.processes.get(agent.id);
        if (proc) {
          proc.status = code === 0 ? 'stopped' : 'error';
          proc.error = code !== 0 ? `Exited with code ${code}` : undefined;
        }
      });

      child.on('error', (err) => {
        this.logger.error(`Agent ${agent.name} process error: ${err.message}`);
        const proc = this.processes.get(agent.id);
        if (proc) {
          proc.status = 'error';
          proc.error = err.message;
        }
      });

      this.processes.set(agent.id, {
        process: child,
        status: 'running',
      });

      this.logger.log(`Started agent ${agent.name} (PID: ${child.pid})`);
    } catch (err: any) {
      this.logger.error(`Failed to start agent ${agent.name}: ${err.message}`);
      this.processes.set(agent.id, {
        process: null as any,
        status: 'error',
        error: err.message,
      });
    }
  }

  async stop(agentId: string): Promise<void> {
    const proc = this.processes.get(agentId);
    if (!proc || proc.status !== 'running') {
      return;
    }

    return new Promise<void>((resolve) => {
      const child = proc.process;

      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        proc.status = 'stopped';
        resolve();
      }, 5000);

      child.on('exit', () => {
        clearTimeout(timeout);
        proc.status = 'stopped';
        resolve();
      });

      child.kill('SIGTERM');
    });
  }

  private generateAgentScript(agent: Agent): string {
    const mcpServers = (agent.mcpServers || []).filter((m) => m.enabled);
    const hasMcp = mcpServers.length > 0;
    const hasWebSearch = agent.webSearchEnabled;

    const script = `
// Auto-generated agent runner for: ${agent.name}
// DO NOT EDIT — regenerated on each agent start
//
// IMPORTANT: defineAgent + module.exports + cli.runApp are all TOP-LEVEL
// and synchronous. The LiveKit framework requires the default export to
// be available immediately when it imports this file.
// All async work (token fetch, MCP, etc.) happens inside entry().

const { WorkerOptions, cli, defineAgent, llm, voice } = require('@livekit/agents');
const openai = require('@livekit/agents-plugin-openai');
const https = require('https');

// Prevent unhandled errors from crashing the process
process.on('uncaughtException', (err) => {
  console.error('[Agent] Uncaught exception (non-fatal):', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Agent] Unhandled rejection (non-fatal):', reason);
});

const config = JSON.parse(process.env.AGENT_CONFIG || '{}');
const OPEN_AI_TOKEN_URL = process.env.OPEN_AI_TOKEN_URL || '';

console.log('[Agent] Script loaded for agent:', config.name);

// ── Helper: fetch a fresh short-lived OpenAI API key (with retry) ──
async function fetchOpenAIToken(retries = 3) {
  if (!OPEN_AI_TOKEN_URL) {
    throw new Error('OPEN_AI_TOKEN_URL is not configured');
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log('[Token] Fetching fresh OpenAI token from', OPEN_AI_TOKEN_URL, '(attempt ' + attempt + ')');
      const res = await fetch(OPEN_AI_TOKEN_URL);
      const rawBody = await res.text();
      if (!res.ok) {
        throw new Error('Token endpoint returned HTTP ' + res.status + ': ' + rawBody);
      }
      if (!rawBody || rawBody.trim().length === 0) {
        throw new Error('Token endpoint returned an empty response');
      }
      let data;
      try {
        data = JSON.parse(rawBody);
      } catch (parseErr) {
        throw new Error('Token endpoint returned invalid JSON: ' + rawBody.substring(0, 200));
      }
      const token = data.token;
      if (!token) {
        throw new Error('Token endpoint response missing "token" field: ' + rawBody.substring(0, 200));
      }
      console.log('[Token] Obtained fresh OpenAI token (' + token.substring(0, 8) + '...)');
      return token;
    } catch (err) {
      console.error('[Token] Attempt ' + attempt + ' failed:', err.message);
      if (attempt === retries) throw err;
      // Wait before retry (500ms, 1000ms, ...)
      await new Promise(r => setTimeout(r, attempt * 500));
    }
  }
}

${hasWebSearch ? `
// ── Web search tool implementation ──
async function webSearch(query) {
  const apiKey = config.webSearchApiKey;
  if (apiKey) {
    return new Promise((resolve) => {
      const data = JSON.stringify({ api_key: apiKey, query, max_results: 5 });
      const req = https.request({
        hostname: 'api.tavily.com', path: '/search', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve((result.results || []).map(r => r.title + ': ' + r.content).join('\\n\\n') || 'No results found.');
          } catch { resolve('Search failed.'); }
        });
      });
      req.on('error', () => resolve('Search failed.'));
      req.write(data);
      req.end();
    });
  } else {
    return new Promise((resolve) => {
      const url = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1';
      https.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const r = JSON.parse(body);
            const parts = [];
            if (r.Abstract) parts.push(r.Abstract);
            if (r.Answer) parts.push(r.Answer);
            if (r.RelatedTopics) r.RelatedTopics.slice(0, 5).forEach(t => { if (t.Text) parts.push(t.Text); });
            resolve(parts.join('\\n\\n') || 'No results found for: ' + query);
          } catch { resolve('Search failed.'); }
        });
      }).on('error', () => resolve('Search failed.'));
    });
  }
}
` : ''}

${hasMcp ? `
// ── MCP Client adapter ──
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

async function connectMcpServers(servers) {
  const tools = {};
  for (const server of servers) {
    try {
      let transport;
      if (server.type === 'stdio') {
        transport = new StdioClientTransport({ command: server.command, args: server.args || [], env: { ...process.env, ...(server.env || {}) } });
      } else {
        const url = server.url;
        transport = url.endsWith('/sse')
          ? new SSEClientTransport(new URL(url), { requestInit: { headers: server.headers || {} } })
          : new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: server.headers || {} } });
      }
      const client = new Client({ name: 'livekit-agent-' + server.name, version: '1.0.0' }, {});
      await client.connect(transport);
      const toolList = await client.listTools();
      for (const tool of (toolList.tools || [])) {
        const toolName = server.name.replace(/[^a-zA-Z0-9_]/g, '_') + '__' + tool.name;
        tools[toolName] = llm.tool({
          description: tool.description || tool.name,
          parameters: tool.inputSchema || {},
          execute: async (params) => {
            const result = await client.callTool({ name: tool.name, arguments: params });
            if (result.content && result.content.length > 0) return result.content.map(c => c.text || JSON.stringify(c)).join('\\n');
            return JSON.stringify(result);
          },
        });
      }
      console.log('[MCP] Connected to ' + server.name + ', discovered ' + (toolList.tools || []).length + ' tools');
    } catch (err) {
      console.error('[MCP] Failed to connect to ' + server.name + ':', err.message);
    }
  }
  return tools;
}
` : ''}

// ──────────────────────────────────────────────────────────────────────
// TOP-LEVEL: defineAgent — this is what the framework imports
// ──────────────────────────────────────────────────────────────────────
const agent = defineAgent({
  entry: async (ctx) => {
    console.log('[Agent] entry() called — new session for room:', ctx.room.name);

    // 1. Fetch fresh short-lived OpenAI API key for THIS session
    console.log('[Agent] Fetching fresh OpenAI token...');
    const apiKey = await fetchOpenAIToken();
    console.log('[Agent] Got OpenAI token, creating RealtimeModel...');

    // 2. Build tools (web search + MCP) — done per-session so MCP
    //    connections are fresh and scoped to this session
    const allTools = {};
    ${hasWebSearch ? `
    const zod = require('zod');
    allTools.web_search = llm.tool({
      description: 'Search the internet for current information about any topic. Use this when the user asks about recent events, facts you are unsure about, or anything that requires up-to-date information.',
      parameters: zod.z.object({
        query: zod.z.string().describe('The search query to look up on the internet'),
      }),
      execute: async ({ query }) => {
        console.log('[WebSearch] Searching for:', query);
        return await webSearch(query);
      },
    });
    ` : ''}
    ${hasMcp ? `
    const mcpTools = await connectMcpServers(config.mcpServers || []);
    Object.assign(allTools, mcpTools);
    ` : ''}
    console.log('[Agent] Tools ready:', Object.keys(allTools).length);

    // 3. Create the realtime model with the per-session apiKey
    // Ephemeral client secrets (ek_ prefix) require the beta RealtimeModel.
    // Regular API keys (sk- prefix) use the GA RealtimeModel.
    const isBetaToken = apiKey.startsWith('ek_');
    const ModelClass = isBetaToken
      ? openai.realtime.beta.RealtimeModel
      : openai.realtime.RealtimeModel;

    // For beta tokens, use a beta-compatible model name if the user picked a GA name
    let modelName = config.openaiModel || 'gpt-4o-realtime-preview';
    if (isBetaToken && modelName === 'gpt-realtime') {
      modelName = 'gpt-4o-realtime-preview';
    }

    console.log('[Agent] Using', isBetaToken ? 'beta' : 'GA', 'RealtimeModel, model:', modelName);

    const model = new ModelClass({
      model: modelName,
      voice: config.voice || 'alloy',
      apiKey: apiKey,
      connOptions: {
        maxRetry: 3,
        retryIntervalMs: 2000,
        timeoutMs: 30000,
      },
    });

    // 4. Create session + agent
    const session = new voice.AgentSession({ llm: model });
    const agentInstance = new voice.Agent({
      instructions: config.instructions || 'You are a helpful voice AI assistant.',
      tools: Object.keys(allTools).length > 0 ? allTools : undefined,
    });

    // 5. Connect and start
    try {
      console.log('[Agent] Connecting to room...');
      await ctx.connect();
      console.log('[Agent] Connected. Starting session...');

      await session.start({ agent: agentInstance, room: ctx.room });

      console.log('[Agent] Session started. Generating initial greeting...');
      session.generateReply({ instructions: 'Greet the user and offer your assistance.' });
    } catch (err) {
      console.error('[Agent] Failed to start session:', err.message || err);
    }
  },
});

// TOP-LEVEL: export the agent so the framework can find it
module.exports = agent;
module.exports.default = agent;

// TOP-LEVEL: register with LiveKit
console.log('[Agent] Registering worker, agentName:', config.name);
cli.runApp(new WorkerOptions({
  agent: __filename,
  agentName: config.name,
}));
`;

    const scriptPath = path.join(this.templateDir, `agent-${agent.id}.js`);
    fs.writeFileSync(scriptPath, script, 'utf-8');
    return scriptPath;
  }
}
