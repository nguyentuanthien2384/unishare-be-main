import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PlatformStats extends Document {
  @Prop({ default: 0 })
  totalUploads: number;

  @Prop({ default: 0 })
  totalDownloads: number;

  @Prop({ default: 0 })
  activeUsers: number;
}

export const PlatformStatsSchema =
  SchemaFactory.createForClass(PlatformStats);
