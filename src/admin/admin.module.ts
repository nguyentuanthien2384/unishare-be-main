import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Document, DocumentSchema } from '../documents/schemas/document.schema';
import { Subject, SubjectSchema } from '../subjects/schemas/subject.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { LogsModule } from '../logs/logs.module';
import { StatisticsModule } from '../statistics/statistics.module';

@Module({
  imports: [
    LogsModule,
    StatisticsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Major.name, schema: MajorSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
