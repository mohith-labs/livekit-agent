import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { McpServer } from './entities/mcp-server.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { RunnerService } from './runner.service';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent) private agentRepo: Repository<Agent>,
    @InjectRepository(McpServer) private mcpRepo: Repository<McpServer>,
    private runnerService: RunnerService,
  ) {}

  async findAll() {
    const agents = await this.agentRepo.find({ relations: ['mcpServers'] });
    return agents.map((agent) => ({
      ...agent,
      status: this.runnerService.getStatus(agent.id),
    }));
  }

  async findOne(id: string) {
    const agent = await this.agentRepo.findOne({ where: { id }, relations: ['mcpServers'] });
    if (!agent) throw new NotFoundException('Agent not found');
    return {
      ...agent,
      status: this.runnerService.getStatus(agent.id),
    };
  }

  async findByName(name: string) {
    const agent = await this.agentRepo.findOne({ where: { name }, relations: ['mcpServers'] });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async create(dto: CreateAgentDto) {
    const existing = await this.agentRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Agent with this name already exists');

    const agent = this.agentRepo.create({
      name: dto.name,
      livekitUrl: dto.livekitUrl,
      livekitApiKey: dto.livekitApiKey,
      livekitApiSecret: dto.livekitApiSecret,
      openaiModel: dto.openaiModel || 'gpt-4o-realtime-preview',
      voice: dto.voice || 'alloy',
      instructions: dto.instructions || 'You are a helpful voice AI assistant.',
      webSearchEnabled: dto.webSearchEnabled || false,
      webSearchApiKey: dto.webSearchApiKey || undefined,
    });

    const saved = await this.agentRepo.save(agent) as Agent;

    if (dto.mcpServers && dto.mcpServers.length > 0) {
      const mcpServers = dto.mcpServers.map((mcp) =>
        this.mcpRepo.create({
          ...mcp,
          agentId: (saved as Agent).id,
          enabled: mcp.enabled !== undefined ? mcp.enabled : true,
        }),
      );
      await this.mcpRepo.save(mcpServers);
    }

    return this.findOne((saved as Agent).id);
  }

  async update(id: string, dto: UpdateAgentDto) {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== agent.name) {
      const existing = await this.agentRepo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Agent with this name already exists');
    }

    // Update agent fields
    const { mcpServers, ...agentFields } = dto;
    await this.agentRepo.update(id, agentFields);

    // Replace MCP servers if provided
    if (mcpServers !== undefined) {
      await this.mcpRepo.delete({ agentId: id });
      if (mcpServers.length > 0) {
        const newServers = mcpServers.map((mcp) =>
          this.mcpRepo.create({
            ...mcp,
            agentId: id,
            enabled: mcp.enabled !== undefined ? mcp.enabled : true,
          }),
        );
        await this.mcpRepo.save(newServers);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');

    // Stop the agent if running
    if (this.runnerService.getStatus(id) === 'running') {
      await this.runnerService.stop(id);
    }

    await this.agentRepo.remove(agent);
    return { deleted: true };
  }

  async start(id: string) {
    const agent = await this.agentRepo.findOne({ where: { id }, relations: ['mcpServers'] });
    if (!agent) throw new NotFoundException('Agent not found');
    await this.runnerService.start(agent);
    return { status: 'running' };
  }

  async stop(id: string) {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');
    await this.runnerService.stop(id);
    return { status: 'stopped' };
  }
}
