import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getModelToken } from '@nestjs/mongoose';
import { Major } from '../majors/schemas/major.schema';
import { Subject } from '../subjects/schemas/subject.schema';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let majorModel: any;
  let subjectModel: any;

  const mockSubjects = [
    { _id: 'sub1', name: 'Cấu trúc dữ liệu', code: 'CSE201', managingFaculty: 'CNTT' },
    { _id: 'sub2', name: 'Giải tích 1', code: 'MATH101', managingFaculty: 'KHCB' },
    { _id: 'sub3', name: 'Nhập môn lập trình', code: 'CSE101', managingFaculty: 'CNTT' },
  ];

  const mockMajors = [
    { _id: 'maj1', name: 'CNTT', subjects: [mockSubjects[0], mockSubjects[2]] },
    { _id: 'maj2', name: 'Kinh tế', subjects: [] },
  ];

  const createChainableMock = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    majorModel = jest.fn();
    majorModel.find = jest.fn().mockReturnValue(createChainableMock(mockMajors));
    majorModel.findById = jest.fn().mockReturnValue(createChainableMock(mockMajors[0]));

    subjectModel = jest.fn();
    subjectModel.find = jest.fn().mockReturnValue(createChainableMock(mockSubjects));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getModelToken(Major.name), useValue: majorModel },
        { provide: getModelToken(Subject.name), useValue: subjectModel },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMajors', () => {
    it('should return all majors with populated subjects', async () => {
      const result = await service.getAllMajors();

      expect(majorModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockMajors);
      expect(result).toHaveLength(2);
    });

    it('should populate subjects with correct fields', async () => {
      const chainMock = createChainableMock(mockMajors);
      majorModel.find.mockReturnValue(chainMock);

      await service.getAllMajors();

      expect(chainMock.populate).toHaveBeenCalledWith(
        'subjects',
        '_id name code managingFaculty',
      );
    });
  });

  describe('getMajorById', () => {
    it('should return a major by ID with populated subjects', async () => {
      const result = await service.getMajorById('maj1');

      expect(majorModel.findById).toHaveBeenCalledWith('maj1');
      expect(result).toEqual(mockMajors[0]);
    });

    it('should return null if major not found', async () => {
      majorModel.findById.mockReturnValue(createChainableMock(null));

      const result = await service.getMajorById('nonexistent');

      expect(result).toBeNull();
    });

    it('should populate subjects with correct fields', async () => {
      const chainMock = createChainableMock(mockMajors[0]);
      majorModel.findById.mockReturnValue(chainMock);

      await service.getMajorById('maj1');

      expect(chainMock.populate).toHaveBeenCalledWith(
        'subjects',
        '_id name code managingFaculty',
      );
    });
  });

  describe('getAllSubjects', () => {
    it('should return all subjects sorted by name', async () => {
      const result = await service.getAllSubjects();

      expect(subjectModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockSubjects);
    });

    it('should sort subjects by name ascending', async () => {
      const chainMock = createChainableMock(mockSubjects);
      subjectModel.find.mockReturnValue(chainMock);

      await service.getAllSubjects();

      expect(chainMock.sort).toHaveBeenCalledWith({ name: 1 });
    });

    it('should return empty array when no subjects exist', async () => {
      subjectModel.find.mockReturnValue(createChainableMock([]));

      const result = await service.getAllSubjects();

      expect(result).toEqual([]);
    });
  });
});
