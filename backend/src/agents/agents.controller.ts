import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TokenService } from '../token/token.service';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(
    private agentsService: AgentsService,
    private tokenService: TokenService,
  ) {}

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.agentsService.start(id);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string) {
    return this.agentsService.stop(id);
  }

  @Post(':id/playground-token')
  async playgroundToken(@Param('id') id: string) {
    const agent = await this.agentsService.findOne(id);
    return this.tokenService.generateToken(agent.name);
  }
}
