import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  Param,
  Res,
  Get,
  Query,
  Delete,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadDocumentDto } from './dto/upload-document.dto';
import type { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Types } from 'mongoose';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Request() req: AuthenticatedRequest,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    const uploaderId = req.user.userId;
    return this.documentsService.create(uploadDocumentDto, file, uploaderId);
  }

  @Get()
  findAll(@Query() query: Record<string, string | string[]>) {
    const dto = new GetDocumentsQueryDto();
    Object.assign(dto, query);

    if (query['subjects[]']) {
      const raw = query['subjects[]'];
      dto.subjects = Array.isArray(raw) ? raw : [raw];
    } else if (query['subjects']) {
      const raw = query['subjects'];
      dto.subjects = Array.isArray(raw) ? raw : [raw];
    }

    return this.documentsService.findAll(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-uploads')
  getMyUploads(
    @Request() req: AuthenticatedRequest,
    @Query() queryDto: GetDocumentsQueryDto,
  ) {
    const userId = req.user.userId;
    return this.documentsService.findMyDocuments(userId, queryDto);
  }

  @Get('user/:userId/uploads')
  getUserUploads(
    @Param('userId') userId: string,
    @Query() queryDto: GetDocumentsQueryDto,
  ) {
    return this.documentsService.findUserDocuments(userId, queryDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/download')
  async downloadDocument(
    @Param('id') docId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { streamableFile, doc } =
      await this.documentsService.download(docId);
    const originalFilename = doc.fileUrl.split('/').pop();

    res.set({
      'Content-Type': doc.fileType,
      'Content-Disposition': `attachment; filename="${originalFilename}"`,
    });

    return streamableFile;
  }

  @Get(':id/preview')
  async previewDocument(
    @Param('id') docId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { streamableFile, doc } =
      await this.documentsService.preview(docId);
    const originalFilename = doc.fileUrl.split('/').pop();

    res.set({
      'Content-Type': doc.fileType,
      'Content-Disposition': `inline; filename="${originalFilename}"`,
    });

    return streamableFile;
  }

  @Get(':id')
  findOne(@Param('id') docId: string) {
    if (!Types.ObjectId.isValid(docId)) {
      throw new BadRequestException('Invalid document ID format');
    }
    return this.documentsService.findOne(docId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') docId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.documentsService.update(
      docId,
      updateDocumentDto,
      req.user.userId,
      req.user.role,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') docId: string, @Request() req: AuthenticatedRequest) {
    return this.documentsService.remove(
      docId,
      req.user.userId,
      req.user.role,
    );
  }
}
