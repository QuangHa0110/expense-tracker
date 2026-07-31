import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard bảo vệ các route cần đăng nhập.
 * Dùng: @UseGuards(JwtAuthGuard)
 * Chưa có token / token sai / hết hạn -> 401 Unauthorized.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
