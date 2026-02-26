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

  async getStats() {
    return this.statsModel.findOne().lean();
  }
}
