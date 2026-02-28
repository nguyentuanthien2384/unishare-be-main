import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { StatisticsService } from '../statistics/statistics.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../users/schemas/user.schema';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let statisticsService: jest.Mocked<Partial<StatisticsService>>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword123',
    fullName: 'Test User',
    avatarUrl: null,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    uploadsCount: 5,
    downloadsCount: 10,
    joinedDate: new Date('2025-01-01'),
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      password: 'hashedPassword123',
      fullName: 'Test User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    }),
  };

  beforeEach(async () => {
    usersService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    statisticsService = {
      incrementActiveUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: StatisticsService, useValue: statisticsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
    };

    it('should register a new user successfully', async () => {
      usersService.findOneByEmail!.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      usersService.create!.mockResolvedValue(mockUser as any);
      statisticsService.incrementActiveUsers!.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword',
        fullName: registerDto.fullName,
      });
      expect(statisticsService.incrementActiveUsers).toHaveBeenCalledWith(1);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findOneByEmail!.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should hash the password before creating user', async () => {
      usersService.findOneByEmail!.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('secureHash');
      usersService.create!.mockResolvedValue(mockUser as any);

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'secureHash' }),
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should login successfully and return access token', async () => {
      usersService.findOneByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync!.mockResolvedValue('jwt-token-123');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.user).toEqual(
        expect.objectContaining({
          _id: mockUser._id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role,
        }),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findOneByEmail!.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is blocked', async () => {
      const blockedUser = { ...mockUser, status: UserStatus.BLOCKED };
      usersService.findOneByEmail!.mockResolvedValue(blockedUser as any);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      usersService.findOneByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should generate JWT with correct payload', async () => {
      usersService.findOneByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync!.mockResolvedValue('token');

      await service.login(loginDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should not return password in user object', async () => {
      usersService.findOneByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync!.mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('password');
    });
  });
});
