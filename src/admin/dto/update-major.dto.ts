import { IsString, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class UpdateMajorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  subjects?: string[];
}
