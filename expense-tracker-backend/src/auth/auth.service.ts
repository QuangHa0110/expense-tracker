import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // bcrypt: hash password trước khi lưu (10 rounds)
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto.email, dto.name, passwordHash);
    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // 401 — không tiết lộ email có tồn tại hay không
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  /**
   * JWT payload chứa: sub = userId, email, name.
   * TOÀN BỘ logic phân quyền sau này dựa trên payload này,
   * KHÔNG BAO GIỜ tin userId client gửi lên.
   */
  private buildAuthResponse(userId: number, email: string, name: string) {
    const payload = { sub: userId, email, name };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: userId, email, name },
    };
  }
}
