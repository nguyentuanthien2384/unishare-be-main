import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformStats } from './schemas/platform-stats.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(PlatformStats.name)
    private statsModel: Model<PlatformStats>,
  ) {}

  async incrementActiveUsers(amount: number = 1) {
    await this.statsModel.updateOne(
      {},
      { $inc: { activeUsers: amount } },
      { upsert: true },
    );
  }

  async incrementTotalUploads(amount: number = 1) {
    await this.statsModel.updateOne(
      {},
      { $inc: { totalUploads: amount } },
      { upsert: true },
    );
  }

  async incrementTotalDownloads(amount: number = 1) {
    await this.statsModel.updateOne(
      {},
      { $inc: { totalDownloads: amount } },
      { upsert: true },
    );
  }

  async getStats() {
    return this.statsModel.findOne().lean();
  }
}
