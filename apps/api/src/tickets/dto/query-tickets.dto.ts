import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketStatus, TicketPriority, TicketType } from '@prisma/client';

export class QueryTicketsDto {
  @IsEnum(TicketStatus, { message: 'Statut invalide' })
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority, { message: 'Priorité invalide' })
  @IsOptional()
  priority?: TicketPriority;

  @IsEnum(TicketType, { message: 'Type invalide' })
  @IsOptional()
  type?: TicketType;

  @IsString()
  @IsOptional()
  assignedAdminId?: string;

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

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
