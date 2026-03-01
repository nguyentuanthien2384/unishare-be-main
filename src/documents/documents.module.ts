import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, DocumentSchema } from './schemas/document.schema';
import { MulterModule } from '@nestjs/platform-express';
import { UsersModule } from '../users/users.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { LogsModule } from '../logs/logs.module';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
    ]),
    MulterModule.registerAsync({
      useFactory: () => ({
        storage: diskStorage({
          destination: './uploads',
          filename: (_req, file, callback) => {
            const randomName = randomBytes(16).toString('hex');
            const fileExtName = extname(file.originalname);
            callback(null, `${randomName}${fileExtName}`);
          },
        }),
        limits: { fileSize: 100 * 1024 * 1024 },
        fileFilter: (_req, file, callback) => {
          const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'application/zip',
            'application/x-zip-compressed',
          ];
          if (allowedMimes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new Error('Invalid file type.'), false);
          }
        },
      }),
    }),
    UsersModule,
    StatisticsModule,
    LogsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
