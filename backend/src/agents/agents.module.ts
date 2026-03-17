import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { McpServer } from './entities/mcp-server.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { RunnerService } from './runner.service';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, McpServer]),
    AuthModule,
    forwardRef(() => TokenModule),
  ],
  controllers: [AgentsController],
  providers: [AgentsService, RunnerService],
  exports: [AgentsService, RunnerService],
})
export class AgentsModule {}
