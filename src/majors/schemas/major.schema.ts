import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Subject } from '../../subjects/schemas/subject.schema';

@Schema({ timestamps: true })
export class Major extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: false })
  code?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Subject' }],
    default: [],
  })
  subjects: Subject[];
}

export const MajorSchema = SchemaFactory.createForClass(Major);
