import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from '../documents/schemas/document.schema';
import { User } from '../users/schemas/user.schema';
import { PlatformStats } from './schemas/platform-stats.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PlatformStats.name)
    private platformStatsModel: Model<PlatformStats>,
  ) {}

  async getPlatformStats() {
    let stats = await this.platformStatsModel.findOne();
    if (!stats) {
      stats = await this.platformStatsModel.create({});
    }
    return this.formatStats(stats);
  }

  private formatStats(stats: PlatformStats) {
    const { totalUploads, totalDownloads, activeUsers } = stats;
    const avgDlPerDoc = totalUploads > 0 ? totalDownloads / totalUploads : 0;

    return {
      totalUploads,
      totalDownloads,
      activeUsers,
      avgDlPerDoc: parseFloat(avgDlPerDoc.toFixed(2)),
    };
  }

  async getUploadsOverTime(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const results: { date: string; count: number }[] =
      await this.documentModel.aggregate([
        { $match: { uploadDate: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: '$count' } },
      ]);

    return results;
  }

  async incrementTotalUploads(amount: number = 1) {
    await this.platformStatsModel.updateOne(
      {},
      { $inc: { totalUploads: amount } },
      { upsert: true },
    );
  }

  async incrementTotalDownloads(amount: number = 1) {
    await this.platformStatsModel.updateOne(
      {},
      { $inc: { totalDownloads: amount } },
      { upsert: true },
    );
  }

  async incrementActiveUsers(amount: number = 1) {
    await this.platformStatsModel.updateOne(
      {},
      { $inc: { activeUsers: amount } },
      { upsert: true },
    );
  }
}
