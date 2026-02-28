import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole, UserStatus } from './schemas/user.schema';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    avatarUrl: null,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    uploadsCount: 5,
    downloadsCount: 10,
    save: jest.fn(),
  };

  beforeEach(async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockUser),
      lean: jest.fn().mockResolvedValue(mockUser),
    };

    userModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...mockUser, ...dto }),
    }));
    userModel.findOne = jest.fn().mockReturnValue(mockQuery);
    userModel.findById = jest.fn().mockReturnValue(mockQuery);
    userModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
    userModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOneByEmail', () => {
    it('should find user by email', async () => {
      const query = { exec: jest.fn().mockResolvedValue(mockUser) };
      userModel.findOne.mockReturnValue(query);

      const result = await service.findOneByEmail('test@example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const query = { exec: jest.fn().mockResolvedValue(null) };
      userModel.findOne.mockReturnValue(query);

      const result = await service.findOneByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'hashed',
        fullName: 'New User',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(expect.objectContaining(createDto));
    });
  });

  describe('findById', () => {
    it('should find user by ID without password', async () => {
      const query = {
        select: jest.fn().mockReturnValue({
          ...mockUser,
          then: (resolve: any) => resolve(mockUser),
        }),
      };
      userModel.findById.mockReturnValue(query);

      const result = await service.findById(mockUser._id);

      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(query.select).toHaveBeenCalledWith('-password');
    });

    it('should throw NotFoundException if user not found', async () => {
      const query = { select: jest.fn().mockResolvedValue(null) };
      userModel.findById.mockReturnValue(query);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { fullName: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateDto };
      const query = { select: jest.fn().mockResolvedValue(updatedUser) };
      userModel.findByIdAndUpdate.mockReturnValue(query);

      const result = await service.updateProfile(mockUser._id, updateDto);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        updateDto,
        { new: true },
      );
      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      const query = { select: jest.fn().mockResolvedValue(null) };
      userModel.findByIdAndUpdate.mockReturnValue(query);

      await expect(
        service.updateProfile('nonexistent', { fullName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changeDto = {
        oldPassword: 'oldPass',
        newPassword: 'newPass123',
      };
      const userWithSave = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(true),
      };
      userModel.findById.mockResolvedValue(userWithSave);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPass');

      const selectMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, password: undefined }),
      });
      userModel.findById
        .mockResolvedValueOnce(userWithSave)
        .mockReturnValueOnce({ select: selectMock });

      await service.changePassword(mockUser._id, changeDto);

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPass', mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 10);
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', {
          oldPassword: 'old',
          newPassword: 'new123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if old password is wrong', async () => {
      userModel.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(mockUser._id, {
          oldPassword: 'wrong',
          newPassword: 'new123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('incrementUploadCount', () => {
    it('should increment upload count', async () => {
      await service.incrementUploadCount(mockUser._id, 1);

      expect(userModel.updateOne).toHaveBeenCalledWith(
        { _id: mockUser._id },
        { $inc: { uploadsCount: 1 } },
      );
    });

    it('should handle negative amounts (decrement)', async () => {
      await service.incrementUploadCount(mockUser._id, -1);

      expect(userModel.updateOne).toHaveBeenCalledWith(
        { _id: mockUser._id },
        { $inc: { uploadsCount: -1 } },
      );
    });
  });

  describe('incrementTotalDownloads', () => {
    it('should increment download count', async () => {
      await service.incrementTotalDownloads(mockUser._id, 1);

      expect(userModel.updateOne).toHaveBeenCalledWith(
        { _id: mockUser._id },
        { $inc: { downloadsCount: 1 } },
      );
    });
  });

  describe('getMyStats', () => {
    it('should return user statistics', async () => {
      const statsUser = { uploadsCount: 10, downloadsCount: 50 };
      const query = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(statsUser),
        }),
      };
      userModel.findById.mockReturnValue(query);

      const result = await service.getMyStats(mockUser._id);

      expect(result).toEqual({
        totalUploads: 10,
        totalDownloads: 50,
        avgDownloadsPerDoc: 5,
      });
    });

    it('should handle zero uploads (avoid division by zero)', async () => {
      const statsUser = { uploadsCount: 0, downloadsCount: 0 };
      const query = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(statsUser),
        }),
      };
      userModel.findById.mockReturnValue(query);

      const result = await service.getMyStats(mockUser._id);

      expect(result.avgDownloadsPerDoc).toBe(0);
    });

    it('should throw NotFoundException if user not found', async () => {
      const query = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      };
      userModel.findById.mockReturnValue(query);

      await expect(service.getMyStats('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
