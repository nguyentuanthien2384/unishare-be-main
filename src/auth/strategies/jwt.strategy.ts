import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { UserStatus } from '../../users/schemas/user.schema';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token đã bị vô hiệu hóa (đã đăng xuất)');
    }

    const user = await this.usersService.findOneByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
  }
}
