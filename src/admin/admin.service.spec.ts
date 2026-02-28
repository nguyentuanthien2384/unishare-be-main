import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole, UserStatus } from '../users/schemas/user.schema';
import { Document, DocumentStatus } from '../documents/schemas/document.schema';
import { Subject } from '../subjects/schemas/subject.schema';
import { Major } from '../majors/schemas/major.schema';
import { LogsService } from '../logs/logs.service';
import { StatisticsService } from '../statistics/statistics.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let userModel: any;
  let documentModel: any;
  let subjectModel: any;
  let majorModel: any;
  let logsService: any;
  let statisticsService: any;

  const mockUser = {
    _id: 'userId123',
    email: 'user@test.com',
    fullName: 'Test User',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    password: 'hashedPass',
    save: jest.fn(),
  };

  const mockDoc = {
    _id: 'docId123',
    title: 'Test Doc',
    status: DocumentStatus.VISIBLE,
    uploader: { _id: 'userId123', fullName: 'Test', email: 'test@test.com' },
  };

  const mockSubject = {
    _id: 'subjectId123',
    name: 'Test Subject',
    code: 'TST101',
    managingFaculty: 'CNTT',
    save: jest.fn(),
  };

  const mockMajor = {
    _id: 'majorId123',
    name: 'Test Major',
    subjects: [],
    save: jest.fn(),
  };

  const createChainableMock = (result: any) => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    userModel = jest.fn();
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
    userModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);
    userModel.findById = jest.fn().mockResolvedValue(mockUser);
    userModel.find = jest.fn().mockReturnValue(createChainableMock([mockUser]));
    userModel.countDocuments = jest.fn().mockResolvedValue(1);

    documentModel = jest.fn();
    documentModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockDoc);
    documentModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockDoc);
    documentModel.find = jest.fn().mockReturnValue(createChainableMock([mockDoc]));
    documentModel.countDocuments = jest.fn().mockResolvedValue(1);

    subjectModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...mockSubject, ...dto }),
    }));
    subjectModel.findOne = jest.fn().mockResolvedValue(null);
    subjectModel.find = jest.fn().mockReturnValue(createChainableMock([mockSubject]));
    subjectModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockSubject);
    subjectModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockSubject);

    majorModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...mockMajor, ...dto }),
    }));
    majorModel.findOne = jest.fn().mockResolvedValue(null);
    majorModel.find = jest.fn().mockReturnValue(createChainableMock([mockMajor]));
    majorModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockMajor);
    majorModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockMajor);

    logsService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    statisticsService = {
      incrementActiveUsers: jest.fn().mockResolvedValue(undefined),
      incrementTotalUploads: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Document.name), useValue: documentModel },
        { provide: getModelToken(Subject.name), useValue: subjectModel },
        { provide: getModelToken(Major.name), useValue: majorModel },
        { provide: LogsService, useValue: logsService },
        { provide: StatisticsService, useValue: statisticsService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- User Management ---

  describe('blockUser', () => {
    it('should block a user and log the action', async () => {
      await service.blockUser('userId123', 'adminId');

      expect(logsService.createLog).toHaveBeenCalledWith('adminId', 'BLOCK_USER', 'userId123');
      expect(statisticsService.incrementActiveUsers).toHaveBeenCalledWith(-1);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId123',
        { status: UserStatus.BLOCKED },
        { new: true },
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.blockUser('nonexistent', 'adminId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user and log the action', async () => {
      await service.unblockUser('userId123', 'adminId');

      expect(logsService.createLog).toHaveBeenCalledWith('adminId', 'UNBLOCK_USER', 'userId123');
      expect(statisticsService.incrementActiveUsers).toHaveBeenCalledWith(1);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId123',
        { status: UserStatus.ACTIVE },
        { new: true },
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and decrement active users', async () => {
      const result = await service.deleteUser('userId123');

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith('userId123');
      expect(statisticsService.incrementActiveUsers).toHaveBeenCalledWith(-1);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.deleteUser('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setUserRole', () => {
    it('should update user role', async () => {
      await service.setUserRole('userId123', UserRole.MODERATOR);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId123',
        { role: UserRole.MODERATOR },
        { new: true },
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.setUserRole('nonexistent', UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const result = await service.getUsers({ page: 1, limit: 10 } as any);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by search term', async () => {
      await service.getUsers({ page: 1, limit: 10, search: 'test' } as any);

      expect(userModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { fullName: { $regex: 'test', $options: 'i' } },
            { email: { $regex: 'test', $options: 'i' } },
          ]),
        }),
      );
    });

    it('should filter by role', async () => {
      await service.getUsers({
        page: 1,
        limit: 10,
        role: UserRole.ADMIN,
      } as any);

      expect(userModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password to 123456', async () => {
      const userWithSave = { ...mockUser, save: jest.fn() };
      userModel.findById.mockResolvedValue(userWithSave);

      const result = await service.resetPassword('userId123', 'adminId');

      expect(result.newPassword).toBe('123456');
      expect(userWithSave.save).toHaveBeenCalled();
      expect(logsService.createLog).toHaveBeenCalledWith(
        'adminId',
        'RESET_PASSWORD',
        'userId123',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        service.resetPassword('nonexistent', 'adminId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --- Document Management ---

  describe('blockDocument', () => {
    it('should block a document', async () => {
      await service.blockDocument('docId123');

      expect(documentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'docId123',
        { status: DocumentStatus.BLOCKED },
        { new: true },
      );
    });

    it('should throw NotFoundException if document not found', async () => {
      documentModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.blockDocument('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unblockDocument', () => {
    it('should unblock a document', async () => {
      await service.unblockDocument('docId123');

      expect(documentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'docId123',
        { status: DocumentStatus.VISIBLE },
        { new: true },
      );
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document and decrement uploads', async () => {
      const result = await service.deleteDocument('docId123');

      expect(documentModel.findByIdAndDelete).toHaveBeenCalledWith('docId123');
      expect(statisticsService.incrementTotalUploads).toHaveBeenCalledWith(-1);
      expect(result).toEqual({ message: 'Document deleted successfully' });
    });

    it('should throw NotFoundException if document not found', async () => {
      documentModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.deleteDocument('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Subject Management ---

  describe('createSubject', () => {
    it('should create a new subject', async () => {
      const dto = { name: 'New Subject', code: 'NEW101', managingFaculty: 'CNTT' };

      const result = await service.createSubject(dto);

      expect(subjectModel.findOne).toHaveBeenCalledWith({
        $or: [{ code: 'NEW101' }, { name: 'New Subject' }],
      });
      expect(result).toEqual(expect.objectContaining(dto));
    });

    it('should throw ConflictException if subject already exists', async () => {
      subjectModel.findOne.mockResolvedValue(mockSubject);

      await expect(
        service.createSubject({
          name: 'Test Subject',
          code: 'TST101',
          managingFaculty: 'CNTT',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllSubjects', () => {
    it('should return all subjects sorted by name', async () => {
      const result = await service.findAllSubjects();

      expect(subjectModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockSubject]);
    });
  });

  describe('updateSubject', () => {
    it('should update a subject', async () => {
      const dto = { name: 'Updated Subject' };

      const result = await service.updateSubject('subjectId123', dto);

      expect(subjectModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'subjectId123',
        dto,
        { new: true },
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if subject not found', async () => {
      subjectModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateSubject('nonexistent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeSubject', () => {
    it('should delete a subject', async () => {
      const result = await service.removeSubject('subjectId123');

      expect(subjectModel.findByIdAndDelete).toHaveBeenCalledWith('subjectId123');
      expect(result).toEqual({ message: 'Subject deleted successfully' });
    });

    it('should throw NotFoundException if subject not found', async () => {
      subjectModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.removeSubject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Major Management ---

  describe('createMajor', () => {
    it('should create a new major', async () => {
      const dto = { name: 'New Major' };

      const result = await service.createMajor(dto as any);

      expect(majorModel.findOne).toHaveBeenCalledWith({ name: 'New Major' });
      expect(result).toEqual(expect.objectContaining(dto));
    });

    it('should throw ConflictException if major name exists', async () => {
      majorModel.findOne.mockResolvedValue(mockMajor);

      await expect(
        service.createMajor({ name: 'Test Major' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllMajors', () => {
    it('should return all majors with populated subjects', async () => {
      const result = await service.findAllMajors();

      expect(majorModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockMajor]);
    });
  });

  describe('updateMajor', () => {
    it('should update a major', async () => {
      const result = await service.updateMajor('majorId123', { name: 'Updated' } as any);

      expect(majorModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'majorId123',
        { name: 'Updated' },
        { new: true },
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if major not found', async () => {
      majorModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateMajor('nonexistent', { name: 'Updated' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMajor', () => {
    it('should delete a major', async () => {
      const result = await service.removeMajor('majorId123');

      expect(majorModel.findByIdAndDelete).toHaveBeenCalledWith('majorId123');
      expect(result).toEqual({ message: 'Major deleted successfully' });
    });

    it('should throw NotFoundException if major not found', async () => {
      majorModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.removeMajor('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Admin Document Queries ---

  describe('getDocumentsAdmin', () => {
    it('should return paginated documents for admin', async () => {
      const result = await service.getDocumentsAdmin({ page: 1, limit: 10 } as any);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });

    it('should filter documents by search term', async () => {
      await service.getDocumentsAdmin({
        page: 1,
        limit: 10,
        search: 'test',
      } as any);

      expect(documentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [{ title: { $regex: 'test', $options: 'i' } }],
        }),
      );
    });
  });
});
