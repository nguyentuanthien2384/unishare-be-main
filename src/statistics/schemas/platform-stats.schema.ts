import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformStatsDocument = HydratedDocument<PlatformStats>;

@Schema()
export class PlatformStats {
  @Prop({ default: 0 })
  totalUploads: number;

  @Prop({ default: 0 })
  totalDownloads: number;

  @Prop({ default: 0 })
  activeUsers: number;
}

export const PlatformStatsSchema = SchemaFactory.createForClass(PlatformStats);
