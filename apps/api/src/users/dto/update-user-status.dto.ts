import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus, { message: 'Statut invalide' })
  @IsNotEmpty({ message: 'Statut requis' })
  status: UserStatus;
}
