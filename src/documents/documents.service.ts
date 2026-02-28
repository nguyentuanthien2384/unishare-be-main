import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document } from './schemas/document.schema';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UsersService } from '../users/users.service';
import { createReadStream } from 'fs';
import { join } from 'path';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { StatisticsService } from '../statistics/statistics.service';
import { LogsService } from '../logs/logs.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    private usersService: UsersService,
    private statisticsService: StatisticsService,
    private configService: ConfigService,
    private logsService: LogsService,
  ) {}

  async create(
    uploadDocumentDto: UploadDocumentDto,
    file: Express.Multer.File,
    uploaderId: string,
  ): Promise<Document> {
    const baseUrl = this.configService.get<string>('API_URL');
    const relativePath = file.path;
    const fullFileUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    const documentData = new this.documentModel({
      ...uploadDocumentDto,
      fileUrl: fullFileUrl,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      uploader: uploaderId,
    });

    const savedDocument = await documentData.save();

    await savedDocument.populate([
      { path: 'subject', select: 'name code' },
      { path: 'uploader', select: 'fullName avatarUrl' },
    ]);

    await this.usersService.incrementUploadCount(uploaderId, 1);
    await this.statisticsService.incrementTotalUploads(1);

    return savedDocument;
  }

  async download(
    docId: string,
  ): Promise<{ streamableFile: StreamableFile; doc: Document }> {
    const doc = await this.documentModel.findById(docId);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const localFilePath = join(
      process.cwd(),
      (doc as unknown as Record<string, string>).filePath ||
        doc.fileUrl.replace(/^https?:\/\/[^/]+\//, ''),
    );
    try {
      const file = createReadStream(localFilePath);

      doc.downloadCount += 1;
      await doc.save();
      await this.usersService.incrementTotalDownloads(
        String(doc.uploader._id),
        1,
      );
      await this.statisticsService.incrementTotalDownloads(1);

      return {
        streamableFile: new StreamableFile(file),
        doc,
      };
    } catch {
      throw new NotFoundException('File not found on server storage.');
    }
  }

  async findAll(queryDto: GetDocumentsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      subject,
      subjects,
      documentType,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
    } = queryDto;

    const query: Record<string, unknown> = { status: 'VISIBLE' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (subjects && subjects.length > 0) {
      query.subject = { $in: subjects };
    } else if (subject) {
      query.subject = subject;
    }

    if (documentType) {
      query.documentType = documentType;
    }

    const sortField =
      sortBy === 'downloads' ? 'downloadCount' : sortBy;
    const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = {
      [sortField]: sortOrderValue,
    };

    const skip = (page - 1) * limit;

    const [documents, totalDocuments] = await Promise.all([
      this.documentModel
        .find(query)
        .populate('uploader', 'fullName avatarUrl')
        .populate('subject', 'name code')
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

  async findOne(docId: string): Promise<Document> {
    const doc = await this.documentModel
      .findById(docId)
      .populate('uploader', 'fullName avatarUrl')
      .populate('subject', 'name code managingFaculty');

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    doc.viewCount += 1;
    void doc.save();

    return doc;
  }

  private async getDocumentAndCheckOwnership(
    docId: string,
    userId: string,
  ): Promise<Document> {
    const doc = await this.documentModel.findById(docId);

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (String(doc.uploader._id) !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this document',
      );
    }

    return doc;
  }

  async update(
    docId: string,
    updateDocumentDto: UpdateDocumentDto,
    userId: string,
  ): Promise<Document> {
    await this.getDocumentAndCheckOwnership(docId, userId);

    const updatedDoc = await this.documentModel
      .findByIdAndUpdate(docId, updateDocumentDto, { new: true })
      .populate('subject', 'name code')
      .populate('uploader', 'fullName avatarUrl');

    if (!updatedDoc) {
      throw new NotFoundException('Document not found');
    }

    return updatedDoc;
  }

  async remove(docId: string, userId: string): Promise<{ message: string }> {
    const doc = await this.getDocumentAndCheckOwnership(docId, userId);

    await doc.deleteOne();

    await this.usersService.incrementUploadCount(userId, -1);
    await this.statisticsService.incrementTotalUploads(-1);
    await this.logsService.createLog(userId, 'DELETE_OWN_DOCUMENT', docId);

    return { message: 'Document deleted successfully' };
  }

  async findMyDocuments(userId: string, queryDto: GetDocumentsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
    } = queryDto;

    const query: Record<string, unknown> = {
      uploader: new Types.ObjectId(userId),
    };

    if (search) query.title = { $regex: search, $options: 'i' };

    const sortField =
      sortBy === 'downloads' ? 'downloadCount' : 'uploadDate';
    const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = {
      [sortField]: sortOrderValue,
    };

    const skip = (page - 1) * limit;
    const [documents, totalDocuments] = await Promise.all([
      this.documentModel
        .find(query)
        .populate('subject', 'name code')
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

  async findUserDocuments(userId: string, queryDto: GetDocumentsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
    } = queryDto;

    const query: Record<string, unknown> = {
      uploader: new Types.ObjectId(userId),
      status: 'VISIBLE',
    };

    if (search) query.title = { $regex: search, $options: 'i' };

    const sortField =
      sortBy === 'downloads' ? 'downloadCount' : 'uploadDate';
    const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = {
      [sortField]: sortOrderValue,
    };

    const skip = (page - 1) * limit;
    const [documents, totalDocuments] = await Promise.all([
      this.documentModel
        .find(query)
        .populate('uploader', 'fullName')
        .populate('subject', 'name code')
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
