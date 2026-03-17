import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';

@Controller()
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @Get(':agentName/token')
  @UseGuards(BasicAuthGuard)
  async getToken(@Param('agentName') agentName: string) {
    return this.tokenService.generateToken(agentName);
  }
}
