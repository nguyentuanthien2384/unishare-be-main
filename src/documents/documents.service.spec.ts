import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getModelToken } from '@nestjs/mongoose';
import { Document } from './schemas/document.schema';
import { UsersService } from '../users/users.service';
import { StatisticsService } from '../statistics/statistics.service';
import { LogsService } from '../logs/logs.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentModel: any;
  let usersService: any;
  let statisticsService: any;
  let logsService: any;
  let configService: any;

  const mockUploader = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Test User',
    avatarUrl: null,
  };

  const mockSubject = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Test Subject',
    code: 'TST101',
  };

  const mockDocument = {
    _id: '507f1f77bcf86cd799439033',
    title: 'Test Document',
    description: 'Test description',
    fileUrl: 'http://localhost:8000/uploads/test.pdf',
    fileType: 'application/pdf',
    fileSize: 1024000,
    uploader: mockUploader,
    status: 'VISIBLE',
    subject: mockSubject,
    documentType: 'Lecture Notes',
    schoolYear: '2024-2025',
    downloadCount: 10,
    viewCount: 25,
    save: jest.fn(),
    populate: jest.fn(),
    deleteOne: jest.fn(),
  };

  const createChainableMock = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    documentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        ...mockDocument,
        ...dto,
        populate: jest.fn().mockResolvedValue({ ...mockDocument, ...dto }),
      }),
      populate: jest.fn().mockResolvedValue({ ...mockDocument, ...dto }),
    }));
    documentModel.find = jest.fn().mockReturnValue(createChainableMock([mockDocument]));
    documentModel.findById = jest.fn().mockReturnValue(createChainableMock(mockDocument));
    documentModel.findByIdAndUpdate = jest.fn().mockReturnValue(createChainableMock(mockDocument));
    documentModel.countDocuments = jest.fn().mockResolvedValue(1);

    usersService = {
      incrementUploadCount: jest.fn().mockResolvedValue(undefined),
      incrementTotalDownloads: jest.fn().mockResolvedValue(undefined),
    };

    statisticsService = {
      incrementTotalUploads: jest.fn().mockResolvedValue(undefined),
      incrementTotalDownloads: jest.fn().mockResolvedValue(undefined),
    };

    logsService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:8000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getModelToken(Document.name), useValue: documentModel },
        { provide: UsersService, useValue: usersService },
        { provide: StatisticsService, useValue: statisticsService },
        { provide: LogsService, useValue: logsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated documents', async () => {
      const queryDto = { page: 1, limit: 10 };

      const result = await service.findAll(queryDto as any);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by search query', async () => {
      const queryDto = { page: 1, limit: 10, search: 'test' };
      await service.findAll(queryDto as any);

      expect(documentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { title: { $regex: 'test', $options: 'i' } },
          ]),
        }),
      );
    });

    it('should filter by subject', async () => {
      const queryDto = { page: 1, limit: 10, subject: 'subjectId123' };
      await service.findAll(queryDto as any);

      expect(documentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'subjectId123' }),
      );
    });

    it('should filter by multiple subjects', async () => {
      const queryDto = {
        page: 1,
        limit: 10,
        subjects: ['subject1', 'subject2'],
      };
      await service.findAll(queryDto as any);

      expect(documentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: { $in: ['subject1', 'subject2'] },
        }),
      );
    });

    it('should filter by document type', async () => {
      const queryDto = { page: 1, limit: 10, documentType: 'Exam Paper' };
      await service.findAll(queryDto as any);

      expect(documentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'Exam Paper' }),
      );
    });

    it('should only return VISIBLE documents', async () => {
      await service.findAll({ page: 1, limit: 10 } as any);

      expect(documentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'VISIBLE' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a document and increment view count', async () => {
      const doc = {
        ...mockDocument,
        viewCount: 25,
        save: jest.fn().mockResolvedValue(true),
      };
      const thenableDoc = {
        populate: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve(doc),
      };
      documentModel.findById.mockReturnValue(thenableDoc);

      const result = await service.findOne(mockDocument._id);

      expect(documentModel.findById).toHaveBeenCalledWith(mockDocument._id);
      expect(result).toBeDefined();
      expect(doc.viewCount).toBe(26);
      expect(doc.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if document not found', async () => {
      const thenableNull = {
        populate: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve(null),
      };
      documentModel.findById.mockReturnValue(thenableNull);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if document not found', async () => {
      documentModel.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'New' }, 'userId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const doc = {
        ...mockDocument,
        uploader: 'differentUserId',
      };
      documentModel.findById.mockResolvedValue(doc);

      await expect(
        service.update(mockDocument._id, { title: 'New' }, 'userId'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if document not found', async () => {
      documentModel.findById.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', 'userId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const doc = {
        ...mockDocument,
        uploader: 'differentUserId',
      };
      documentModel.findById.mockResolvedValue(doc);

      await expect(
        service.remove(mockDocument._id, 'someUserId'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete document and update statistics', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const doc = {
        ...mockDocument,
        uploader: userId,
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      documentModel.findById.mockResolvedValue(doc);

      const result = await service.remove(mockDocument._id, userId);

      expect(doc.deleteOne).toHaveBeenCalled();
      expect(usersService.incrementUploadCount).toHaveBeenCalledWith(userId, -1);
      expect(statisticsService.incrementTotalUploads).toHaveBeenCalledWith(-1);
      expect(logsService.createLog).toHaveBeenCalledWith(
        userId,
        'DELETE_OWN_DOCUMENT',
        mockDocument._id,
      );
      expect(result).toEqual({ message: 'Document deleted successfully' });
    });
  });

  describe('findMyDocuments', () => {
    it('should return paginated documents for user', async () => {
      const queryDto = { page: 1, limit: 10 };
      const validObjectId = '507f1f77bcf86cd799439011';

      const result = await service.findMyDocuments(validObjectId, queryDto as any);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });
  });

  describe('findUserDocuments', () => {
    it('should return paginated visible documents for a specific user', async () => {
      const queryDto = { page: 1, limit: 10 };
      const validObjectId = '507f1f77bcf86cd799439011';

      const result = await service.findUserDocuments(validObjectId, queryDto as any);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });
  });
});
