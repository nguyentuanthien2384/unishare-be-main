import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
}
