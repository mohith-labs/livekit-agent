import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<boolean> {
    const adminUser = this.configService.get('ADMIN_USERNAME', 'admin');
    const adminPass = this.configService.get('ADMIN_PASSWORD', 'password');
    return username === adminUser && password === adminPass;
  }

  async login(username: string, password: string) {
    const valid = await this.validateUser(username, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: username, role: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
      username,
    };
  }
}
