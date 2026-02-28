import {
  IsOptional,
  IsString,
  IsIn,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetDocumentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsIn(['uploadDate', 'downloadCount'])
  sortBy?: string = 'uploadDate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
