import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class Department extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
