import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Avatar URL không hợp lệ' })
  avatarUrl?: string;
}
