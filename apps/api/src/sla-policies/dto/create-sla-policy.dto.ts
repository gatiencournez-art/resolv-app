import { IsEnum, IsInt, Min } from 'class-validator';
import { TicketPriority } from '@prisma/client';

export class CreateSlaPolicyDto {
  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @IsInt()
  @Min(1)
  responseTime: number; // en minutes

  @IsInt()
  @Min(1)
  resolutionTime: number; // en minutes
}
