import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { TicketType, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'Titre requis' })
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Description requise' })
  @MaxLength(5000)
  description: string;

  @IsEnum(TicketType, { message: 'Type de ticket invalide' })
  @IsOptional()
  type?: TicketType;

  @IsEnum(TicketPriority, { message: 'Priorité invalide' })
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsNotEmpty({ message: 'Prénom du demandeur requis' })
  @MaxLength(50)
  requesterFirstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom du demandeur requis' })
  @MaxLength(50)
  requesterLastName: string;

  @IsEmail({}, { message: 'Email du demandeur invalide' })
  @IsNotEmpty({ message: 'Email du demandeur requis' })
  requesterEmail: string;
}
