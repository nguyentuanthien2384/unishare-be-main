import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { getModelToken } from '@nestjs/mongoose';
import { Document } from '../documents/schemas/document.schema';
import { User } from '../users/schemas/user.schema';
import { PlatformStats } from './schemas/platform-stats.schema';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let documentModel: any;
  let userModel: any;
  let platformStatsModel: any;

  const mockStats = {
    totalUploads: 100,
    totalDownloads: 500,
    activeUsers: 50,
  };

  beforeEach(async () => {
    documentModel = jest.fn();
    documentModel.aggregate = jest.fn().mockResolvedValue([
      { date: '2025-01-01', count: 5 },
      { date: '2025-01-02', count: 3 },
    ]);

    userModel = jest.fn();

    platformStatsModel = jest.fn();
    platformStatsModel.findOne = jest.fn().mockResolvedValue(mockStats);
    platformStatsModel.create = jest.fn().mockResolvedValue({
      totalUploads: 0,
      totalDownloads: 0,
      activeUsers: 0,
    });
    platformStatsModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getModelToken(Document.name), useValue: documentModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(PlatformStats.name), useValue: platformStatsModel },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlatformStats', () => {
    it('should return formatted platform stats', async () => {
      const result = await service.getPlatformStats();

      expect(result).toEqual({
        totalUploads: 100,
        totalDownloads: 500,
        activeUsers: 50,
        avgDlPerDoc: 5,
      });
    });

    it('should create stats if none exist', async () => {
      platformStatsModel.findOne.mockResolvedValue(null);

      const result = await service.getPlatformStats();

      expect(platformStatsModel.create).toHaveBeenCalledWith({});
      expect(result).toEqual({
        totalUploads: 0,
        totalDownloads: 0,
        activeUsers: 0,
        avgDlPerDoc: 0,
      });
    });

    it('should handle zero uploads (avoid division by zero)', async () => {
      platformStatsModel.findOne.mockResolvedValue({
        totalUploads: 0,
        totalDownloads: 0,
        activeUsers: 10,
      });

      const result = await service.getPlatformStats();

      expect(result.avgDlPerDoc).toBe(0);
    });

    it('should calculate average downloads per doc correctly', async () => {
      platformStatsModel.findOne.mockResolvedValue({
        totalUploads: 3,
        totalDownloads: 10,
        activeUsers: 5,
      });

      const result = await service.getPlatformStats();

      expect(result.avgDlPerDoc).toBe(3.33);
    });
  });

  describe('getUploadsOverTime', () => {
    it('should return uploads grouped by date', async () => {
      const result = await service.getUploadsOverTime(30);

      expect(documentModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual([
        { date: '2025-01-01', count: 5 },
        { date: '2025-01-02', count: 3 },
      ]);
    });

    it('should use default 30 days if not specified', async () => {
      await service.getUploadsOverTime();

      expect(documentModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              uploadDate: expect.any(Object),
            }),
          }),
        ]),
      );
    });

    it('should return empty array when no uploads in range', async () => {
      documentModel.aggregate.mockResolvedValue([]);

      const result = await service.getUploadsOverTime(7);

      expect(result).toEqual([]);
    });
  });

  describe('incrementTotalUploads', () => {
    it('should increment total uploads', async () => {
      await service.incrementTotalUploads(1);

      expect(platformStatsModel.updateOne).toHaveBeenCalledWith(
        {},
        { $inc: { totalUploads: 1 } },
        { upsert: true },
      );
    });

    it('should handle negative amounts (decrement)', async () => {
      await service.incrementTotalUploads(-1);

      expect(platformStatsModel.updateOne).toHaveBeenCalledWith(
        {},
        { $inc: { totalUploads: -1 } },
        { upsert: true },
      );
    });
  });

  describe('incrementTotalDownloads', () => {
    it('should increment total downloads', async () => {
      await service.incrementTotalDownloads(1);

      expect(platformStatsModel.updateOne).toHaveBeenCalledWith(
        {},
        { $inc: { totalDownloads: 1 } },
        { upsert: true },
      );
    });
  });

  describe('incrementActiveUsers', () => {
    it('should increment active users', async () => {
      await service.incrementActiveUsers(1);

      expect(platformStatsModel.updateOne).toHaveBeenCalledWith(
        {},
        { $inc: { activeUsers: 1 } },
        { upsert: true },
      );
    });

    it('should handle decrement for blocked/deleted users', async () => {
      await service.incrementActiveUsers(-1);

      expect(platformStatsModel.updateOne).toHaveBeenCalledWith(
        {},
        { $inc: { activeUsers: -1 } },
        { upsert: true },
      );
    });
  });
});
