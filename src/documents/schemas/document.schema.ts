import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Subject } from '../../subjects/schemas/subject.schema';

export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  VISIBLE = 'VISIBLE',
  BLOCKED = 'BLOCKED',
}

@Schema({ timestamps: { createdAt: 'uploadDate', updatedAt: true } })
export class Document extends mongoose.Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  filePath: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  uploader: User;

  @Prop({
    type: String,
    enum: DocumentStatus,
    default: DocumentStatus.VISIBLE,
  })
  status: DocumentStatus;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  })
  subject: Subject;

  @Prop()
  documentType: string;

  @Prop()
  schoolYear: string;

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop({ default: 0 })
  viewCount: number;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
