import { IsString, IsOptional } from 'class-validator';

export class AssignTicketDto {
  @IsString()
  @IsOptional()
  assignedAdminId: string | null;
}
