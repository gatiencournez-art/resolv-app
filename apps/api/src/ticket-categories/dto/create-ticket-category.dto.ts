import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateTicketCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nom requis' })
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Couleur requise' })
  @MaxLength(9)
  color: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
