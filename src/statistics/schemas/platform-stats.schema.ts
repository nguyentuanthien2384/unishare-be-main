import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PlatformStats extends Document {
  @Prop({ default: 0 })
  totalUsers: number;

  @Prop({ default: 0 })
  activeUsers: number;

  @Prop({ default: 0 })
  totalDocuments: number;

  @Prop({ default: 0 })
  totalDownloads: number;
}

export const PlatformStatsSchema = SchemaFactory.createForClass(PlatformStats);
