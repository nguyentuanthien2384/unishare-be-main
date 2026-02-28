import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId({ message: 'Subject ID không hợp lệ' })
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  schoolYear?: string;
}
