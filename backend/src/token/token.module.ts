import { Module, forwardRef } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { AuthModule } from '../auth/auth.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AuthModule, forwardRef(() => AgentsModule)],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
