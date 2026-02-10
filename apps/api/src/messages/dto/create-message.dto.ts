import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Contenu du message requis' })
  @MaxLength(10000)
  content: string;
}
