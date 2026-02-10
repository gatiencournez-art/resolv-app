import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { TicketType, TicketPriority } from '@prisma/client';

export class UpdateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'Titre requis' })
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty({ message: 'Description requise' })
  @MaxLength(5000)
  @IsOptional()
  description?: string;

  @IsEnum(TicketType, { message: 'Type de ticket invalide' })
  @IsOptional()
  type?: TicketType;

  @IsEnum(TicketPriority, { message: 'Priorité invalide' })
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsNotEmpty({ message: 'Prénom du demandeur requis' })
  @MaxLength(50)
  @IsOptional()
  requesterFirstName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom du demandeur requis' })
  @MaxLength(50)
  @IsOptional()
  requesterLastName?: string;

  @IsEmail({}, { message: 'Email du demandeur invalide' })
  @IsOptional()
  requesterEmail?: string;
}
