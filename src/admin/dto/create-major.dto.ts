import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class CreateMajorDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên ngành học không được để trống' })
  name: string;

  @IsArray()
  @IsMongoId({ each: true, message: 'Mỗi subject phải là MongoID hợp lệ' })
  @IsOptional()
  subjects?: string[];
}
