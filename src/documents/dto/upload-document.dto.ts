import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId({ message: 'Subject ID không hợp lệ' })
  @IsNotEmpty({ message: 'Môn học không được để trống' })
  subject: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  faculty?: string;
}
