import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { TokenModule } from './token/token.module';
import { Agent } from './agents/entities/agent.entity';
import { McpServer } from './agents/entities/mcp-server.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/agents.db',
      entities: [Agent, McpServer],
      synchronize: true,
    }),
    AuthModule,
    AgentsModule,
    TokenModule,
  ],
})
export class AppModule {}
