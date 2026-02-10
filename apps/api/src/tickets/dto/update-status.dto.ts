import { IsEnum, IsNotEmpty } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(TicketStatus, { message: 'Statut invalide' })
  @IsNotEmpty({ message: 'Statut requis' })
  status: TicketStatus;
}
