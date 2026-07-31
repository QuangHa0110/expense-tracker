import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: number; // userId
  email: string;
  name: string;
}

/**
 * JWT Strategy — biến token thành user trong request.
 * Khi request có header: Authorization: Bearer <token>,
 * passport tự verify chữ ký JWT, rồi gọi validate() bên dưới.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  /**
   * Chạy sau khi JWT verify thành công.
   * Trả về object nào thì object đó được gắn vào request.user.
   * userId = payload.sub — KHÔNG bao giờ lấy userId từ body/query client.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return null; // user bị xóa -> passport trả 401
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}
