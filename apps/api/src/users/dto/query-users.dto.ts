import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole, UserStatus } from '@prisma/client';

export class QueryUsersDto {
  @IsEnum(UserRole, { message: 'Rôle invalide' })
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus, { message: 'Statut invalide' })
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
