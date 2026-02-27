import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../users/schemas/user.schema';

export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['joinedDate', 'fullName', 'email'])
  sortBy?: string = 'joinedDate';

  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
