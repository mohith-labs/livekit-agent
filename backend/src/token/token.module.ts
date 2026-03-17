import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { AuthModule } from '../auth/auth.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AuthModule, AgentsModule],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
