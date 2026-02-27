import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document, DocumentStatus } from '../documents/schemas/document.schema';
import { User, UserRole, UserStatus } from '../users/schemas/user.schema';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { LogsService } from '../logs/logs.service';
import { StatisticsService } from '../statistics/statistics.service';
import { Subject } from '../subjects/schemas/subject.schema';
import { Major } from '../majors/schemas/major.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import * as bcrypt from 'bcrypt';
import { GetDocumentsQueryDto } from '../documents/dto/get-documents-query.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Document.name) private documentModel: Model<Document>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Major.name) private majorModel: Model<Major>,
    private logsService: LogsService,
    private statisticsService: StatisticsService,
  ) {}

  private async updateUserStatus(
    userId: string,
    status: UserStatus,
  ): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { status },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async blockDocument(docId: string): Promise<Document> {
    return this.updateDocumentStatus(docId, DocumentStatus.BLOCKED);
  }

  async unblockDocument(docId: string): Promise<Document> {
    return this.updateDocumentStatus(docId, DocumentStatus.VISIBLE);
  }

  private async updateDocumentStatus(
    docId: string,
    status: DocumentStatus,
  ): Promise<Document> {
    const doc = await this.documentModel.findByIdAndUpdate(
      docId,
      { status },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findByIdAndDelete(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.statisticsService.incrementActiveUsers(-1);
    return { message: 'User deleted successfully' };
  }

  async deleteDocument(docId: string): Promise<{ message: string }> {
    const doc = await this.documentModel.findByIdAndDelete(docId);
    if (!doc) throw new NotFoundException('Document not found');

    await this.statisticsService.incrementTotalUploads(-1);
    return { message: 'Document deleted successfully' };
  }

  async setUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUsers(queryDto: GetUsersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'joinedDate',
      role,
    } = queryDto;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortBy === 'joinedDate' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      data: users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    };
  }

  async resetPassword(
    userId: string,
    actorId: string,
  ): Promise<{ message: string; newPassword?: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await this.logsService.createLog(actorId, 'RESET_PASSWORD', userId);

    return {
      message: `Đã reset mật khẩu cho ${user.email} thành công.`,
      newPassword,
    };
  }

  async createSubject(createSubjectDto: CreateSubjectDto) {
    const existing = await this.subjectModel.findOne({
      $or: [{ code: createSubjectDto.code }, { name: createSubjectDto.name }],
    });
    if (existing) {
      throw new ConflictException('Subject code or name already exists');
    }
    const newSubject = new this.subjectModel(createSubjectDto);
    return newSubject.save();
  }

  async findAllSubjects() {
    return this.subjectModel.find().sort({ name: 1 }).exec();
  }

  async updateSubject(id: string, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.subjectModel.findByIdAndUpdate(
      id,
      updateSubjectDto,
      { new: true },
    );
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async removeSubject(id: string) {
    const subject = await this.subjectModel.findByIdAndDelete(id);
    if (!subject) throw new NotFoundException('Subject not found');
    return { message: 'Subject deleted successfully' };
  }

  async blockUser(userId: string, actorId: string): Promise<User> {
    await this.logsService.createLog(actorId, 'BLOCK_USER', userId);
    await this.statisticsService.incrementActiveUsers(-1);
    return this.updateUserStatus(userId, UserStatus.BLOCKED);
  }

  async unblockUser(userId: string, actorId: string): Promise<User> {
    await this.logsService.createLog(actorId, 'UNBLOCK_USER', userId);
    await this.statisticsService.incrementActiveUsers(1);
    return this.updateUserStatus(userId, UserStatus.ACTIVE);
  }

  async createMajor(createMajorDto: CreateMajorDto) {
    const existing = await this.majorModel.findOne({
      name: createMajorDto.name,
    });
    if (existing) {
      throw new ConflictException('Major name already exists');
    }
    const newMajor = new this.majorModel(createMajorDto);
    return newMajor.save();
  }

  async findAllMajors() {
    return this.majorModel
      .find()
      .populate('subjects', 'name code')
      .sort({ name: 1 })
      .exec();
  }

  async updateMajor(id: string, updateMajorDto: UpdateMajorDto) {
    const major = await this.majorModel.findByIdAndUpdate(id, updateMajorDto, {
      new: true,
    });
    if (!major) throw new NotFoundException('Major not found');
    return major;
  }

  async removeMajor(id: string) {
    const major = await this.majorModel.findByIdAndDelete(id);
    if (!major) throw new NotFoundException('Major not found');
    return { message: 'Major deleted successfully' };
  }

  async getDocumentsAdmin(queryDto: GetDocumentsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
    } = queryDto;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }];
    }

    const sortField = sortBy === 'downloads' ? 'downloadCount' : 'uploadDate';
    const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = {
      [sortField]: sortOrderValue,
    };

    const skip = (page - 1) * limit;
    const [documents, totalDocuments] = await Promise.all([
      this.documentModel
        .find(query)
        .populate('uploader', 'fullName email')
        .populate('subject', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel.countDocuments(query),
    ]);

    return {
      data: documents,
      pagination: {
        total: totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
      },
    };
  }
}
