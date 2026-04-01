import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });
      // إضافة المستخدم إلى الـ socket لاستخدامه في الـ Gateway
      client.handshake.auth.userId = payload.sub;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // استخراج التوكن من auth أو headers
    const auth = client.handshake.auth;
    if (auth && auth.token) {
      return auth.token;
    }
    const headers = client.handshake.headers;
    if (headers && headers.authorization) {
      const [type, token] = headers.authorization.split(' ');
      return type === 'Bearer' ? token : null;
    }
    return null;
  }
}