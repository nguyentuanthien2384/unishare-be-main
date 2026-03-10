import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { User, UserRole } from './schemas/user.schema';
import { Document } from '../documents/schemas/document.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LogsService } from '../logs/logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Document.name) private documentModel: Model<Document>,
    @InjectConnection() private connection: Connection,
    private logsService: LogsService,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true })
      .select('-password');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const changedFields = Object.keys(updateProfileDto).join(', ');
    await this.logsService.createLog(userId, 'UPDATE_PROFILE', userId, `Cập nhật thông tin cá nhân: ${changedFields}`);

    return updatedUser;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu cũ không chính xác');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await user.save();

    await this.logsService.createLog(userId, 'CHANGE_PASSWORD', userId, `Đổi mật khẩu thành công`);

    return this.userModel
      .findById(userId)
      .select('-password')
      .exec() as Promise<User>;
  }

  async incrementUploadCount(userId: string, amount: number = 1) {
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { uploadsCount: amount } },
    );
  }

  async incrementTotalDownloads(userId: string, amount: number = 1) {
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { downloadsCount: amount } },
    );
  }

  async deleteOwnAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin phải ủy quyền cho người khác trước khi xóa tài khoản',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }

    await this.documentModel.deleteMany({ uploader: userId });
    await this.logsService.createLog(userId, 'DELETE_OWN_ACCOUNT', userId, `Xóa tài khoản ${user.fullName} (${user.email}) và toàn bộ tài liệu`);
    await this.userModel.findByIdAndDelete(userId);
    return { message: 'Tài khoản và toàn bộ tài liệu đã được xóa thành công' };
  }

  async getMyStats(userId: string) {
    const userStats = await this.userModel
      .findById(userId)
      .select('uploadsCount downloadsCount')
      .lean();

    if (!userStats) {
      throw new NotFoundException('User not found');
    }

    const avgDownloads =
      userStats.uploadsCount > 0
        ? userStats.downloadsCount / userStats.uploadsCount
        : 0;

    return {
      totalUploads: userStats.uploadsCount,
      totalDownloads: userStats.downloadsCount,
      avgDownloadsPerDoc: parseFloat(avgDownloads.toFixed(2)),
    };
  }

  async getMyUploadStats(
    userId: string,
    period: string = 'all',
    fromDate?: string,
    toDate?: string,
  ) {
    const documentsCollection = this.connection.collection('documents');
    const mongoose = await import('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchStage: Record<string, unknown> = { uploader: userObjectId };

    if (period === 'custom' && fromDate) {
      const dateFilter: Record<string, Date> = {
        $gte: new Date(fromDate),
      };
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      matchStage.uploadDate = dateFilter;
    } else if (period !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'day':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      matchStage.uploadDate = { $gte: startDate };
    }

    const results = await documentsCollection
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' },
            },
            count: { $sum: 1 },
            totalDownloads: { $sum: '$downloadCount' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: '$count',
            totalDownloads: '$totalDownloads',
          },
        },
      ])
      .toArray();

    const totalCount = results.reduce(
      (sum, r) => sum + (r.count as number),
      0,
    );
    const totalDownloads = results.reduce(
      (sum, r) => sum + (r.totalDownloads as number),
      0,
    );

    return {
      period,
      totalDocuments: totalCount,
      totalDownloads,
      data: results,
    };
  }
}
