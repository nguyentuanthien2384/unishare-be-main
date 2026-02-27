import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên môn học không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Mã môn học không được để trống' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Khoa quản lý không được để trống' })
  managingFaculty: string;
}
