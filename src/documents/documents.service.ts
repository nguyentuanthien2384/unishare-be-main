import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document } from './schemas/document.schema';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UsersService } from '../users/users.service';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { StatisticsService } from '../statistics/statistics.service';
import { LogsService } from '../logs/logs.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly thumbnailRelDir = join('uploads', 'thumbnails');
  private readonly thumbnailDir = join(process.cwd(), 'uploads', 'thumbnails');

  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    private usersService: UsersService,
    private statisticsService: StatisticsService,
    private configService: ConfigService,
    private logsService: LogsService,
  ) {
    if (!existsSync(this.thumbnailDir)) {
      mkdirSync(this.thumbnailDir, { recursive: true });
    }
  }

  private async generateThumbnail(
    filePath: string,
    fileName: string,
  ): Promise<string | null> {
    try {
      const { pdfToPng } = await (Function(
        'return import("pdf-to-png-converter")',
      )() as Promise<typeof import('pdf-to-png-converter')>);

      const absolutePath = join(process.cwd(), filePath);
      const pngFileName = `${fileName}.png`;
      const pages = await pdfToPng(absolutePath, {
        viewportScale: 1.5,
        pagesToProcess: [1],
        outputFolder: this.thumbnailRelDir,
        outputFileMaskFunc: () => pngFileName,
      });

      if (pages.length > 0 && pages[0].path) {
        const baseUrl = this.configService.get<string>('API_URL');
        return `${baseUrl}/uploads/thumbnails/${pngFileName}`;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to generate thumbnail: ${error}`);
      return null;
    }
  }

  async create(
    uploadDocumentDto: UploadDocumentDto,
    file: Express.Multer.File,
    uploaderId: string,
  ): Promise<Document> {
    const baseUrl = this.configService.get<string>('API_URL');
    const relativePath = file.path;
    const fullFileUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    let thumbnailUrl: string | null = null;
    if (file.mimetype === 'application/pdf') {
      const thumbName = file.filename.replace(/\.[^.]+$/, '');
      thumbnailUrl = await this.generateThumbnail(file.path, thumbName);
    }

    const documentData = new this.documentModel({
      ...uploadDocumentDto,
      fileUrl: fullFileUrl,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      uploader: uploaderId,
      ...(thumbnailUrl && { thumbnailUrl }),
    });

    const savedDocument = await documentData.save();

    await savedDocument.populate([
      { path: 'subject', select: 'name code' },
      { path: 'uploader', select: 'fullName avatarUrl' },
    ]);

    await this.usersService.incrementUploadCount(uploaderId, 1);
    await this.statisticsService.incrementTotalUploads(1);
    await this.logsService.createLog(uploaderId, 'UPLOAD_DOCUMENT', String(savedDocument._id), `Upload tài liệu "${savedDocument.title}"`);

    return savedDocument;
  }

  async download(
    docId: string,
    userId?: string,
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
        String(doc.uploader),
        1,
      );
      await this.statisticsService.incrementTotalDownloads(1);

      if (userId) {
        await this.logsService.createLog(userId, 'DOWNLOAD_DOCUMENT', docId, `Tải tài liệu "${doc.title}"`);
      }

      return {
        streamableFile: new StreamableFile(file),
        doc,
      };
    } catch {
      throw new NotFoundException('File not found on server storage.');
    }
  }

  async preview(
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
      return { streamableFile: new StreamableFile(file), doc };
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
      uploader,
      fromDate,
      toDate,
      faculty,
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

    if (uploader) {
      query.uploader = new Types.ObjectId(uploader);
    }

    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      query.uploadDate = dateFilter;
    }

    if (faculty) {
      const subjectsInFaculty = await this.documentModel.db
        .collection('subjects')
        .find({ managingFaculty: { $regex: faculty, $options: 'i' } })
        .project({ _id: 1 })
        .toArray();
      const subjectIds = subjectsInFaculty.map((s) => s._id);
      if (subjectIds.length > 0) {
        query.subject = query.subject
          ? { $in: subjectIds }
          : { $in: subjectIds };
      }
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
        .populate('subject', 'name code managingFaculty')
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
    userRole?: string,
  ): Promise<Document> {
    const doc = await this.documentModel.findById(docId);

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'MODERATOR';
    if (!isAdmin && String(doc.uploader) !== userId) {
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
    userRole?: string,
  ): Promise<Document> {
    const oldDoc = await this.getDocumentAndCheckOwnership(docId, userId, userRole);
    const oldTitle = oldDoc.title;

    const updatedDoc = await this.documentModel
      .findByIdAndUpdate(docId, updateDocumentDto, { new: true })
      .populate('subject', 'name code')
      .populate('uploader', 'fullName avatarUrl');

    if (!updatedDoc) {
      throw new NotFoundException('Document not found');
    }

    await this.logsService.createLog(userId, 'UPDATE_DOCUMENT', docId, `Cập nhật tài liệu "${oldTitle}" → "${updatedDoc.title}"`);

    return updatedDoc;
  }

  async remove(
    docId: string,
    userId: string,
    userRole?: string,
  ): Promise<{ message: string }> {
    const doc = await this.getDocumentAndCheckOwnership(
      docId,
      userId,
      userRole,
    );

    const docTitle = doc.title;
    await doc.deleteOne();

    await this.usersService.incrementUploadCount(userId, -1);
    await this.statisticsService.incrementTotalUploads(-1);
    await this.logsService.createLog(userId, 'DELETE_OWN_DOCUMENT', docId, `Xóa tài liệu "${docTitle}"`);

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

  async generateMissingThumbnails(): Promise<{ processed: number; success: number; failed: number }> {
    const docs = await this.documentModel.find({
      $or: [
        { thumbnailUrl: { $exists: false } },
        { thumbnailUrl: null },
        { thumbnailUrl: '' },
      ],
      fileType: 'application/pdf',
    } as any);

    let success = 0;
    let failed = 0;

    for (const doc of docs) {
      const filePath = (doc as unknown as Record<string, string>).filePath;
      if (!filePath) {
        failed++;
        continue;
      }

      const fileName = filePath.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
      const thumbnailUrl = await this.generateThumbnail(filePath, fileName);

      if (thumbnailUrl) {
        doc.thumbnailUrl = thumbnailUrl;
        await doc.save();
        success++;
      } else {
        failed++;
      }
    }

    return { processed: docs.length, success, failed };
  }
}
