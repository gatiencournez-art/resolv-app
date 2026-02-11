import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class UpdateTicketCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(9)
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
