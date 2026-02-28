import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khoa không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
