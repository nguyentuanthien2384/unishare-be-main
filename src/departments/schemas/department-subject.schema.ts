import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class DepartmentSubject extends mongoose.Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  })
  departmentId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  })
  subjectId: mongoose.Types.ObjectId;

  @Prop()
  note: string;
}

export const DepartmentSubjectSchema =
  SchemaFactory.createForClass(DepartmentSubject);
