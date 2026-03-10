import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StatisticsService } from '../statistics/statistics.service';
import { LogsService } from '../logs/logs.service';
import { User, UserStatus } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  private tokenBlacklist: Set<string> = new Set();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private statisticsService: StatisticsService,
    private logsService: LogsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trên hệ thống');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&size=128`;

    const user: User = await this.usersService.create({
      email,
      password: hashedPassword,
      fullName,
      avatarUrl: defaultAvatar,
    });

    await this.statisticsService.incrementActiveUsers(1);
    await this.logsService.createLog(String(user._id), 'REGISTER', String(user._id), `Đăng ký tài khoản mới: ${user.fullName} (${email})`);

    const userObj = user.toObject() as Record<string, unknown>;
    delete userObj.password;
    return userObj;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        'Email không tồn tại trong hệ thống.',
      );
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException(
        'Tài khoản đã bị khóa. Liên hệ quản trị viên.',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không chính xác.');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.logsService.createLog(String(user._id), 'LOGIN', String(user._id), `Đăng nhập: ${user.fullName} (${user.email})`);

    return {
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        joinedDate: (user as unknown as Record<string, unknown>).joinedDate,
        uploadsCount: user.uploadsCount,
        downloadsCount: user.downloadsCount,
      },
    };
  }

  async logout(token: string, userId?: string): Promise<{ message: string }> {
    this.tokenBlacklist.add(token);
    if (userId) {
      await this.logsService.createLog(userId, 'LOGOUT', userId, 'Đăng xuất khỏi hệ thống');
    }
    return { message: 'Đăng xuất thành công' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        'Email không tồn tại trong hệ thống.',
      );
    }

    const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedNewPassword = await bcrypt.hash(resetToken, 10);
    user.password = hashedNewPassword;
    await (user as User & { save(): Promise<void> }).save();

    await this.logsService.createLog(String(user._id), 'FORGOT_PASSWORD', String(user._id), `Yêu cầu reset mật khẩu cho ${email}`);

    return {
      message: `Mật khẩu mới đã được tạo. Vui lòng đăng nhập bằng mật khẩu mới và đổi mật khẩu ngay.`,
      resetToken,
    };
  }
}
