import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import {
  PlatformStats,
  PlatformStatsSchema,
} from './schemas/platform-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformStats.name, schema: PlatformStatsSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
