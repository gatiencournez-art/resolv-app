import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie l'accès au ticket (tenant-safe + rôle)
   */
  private async verifyTicketAccess(ticketId: string, user: AuthenticatedUser) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        createdByUserId: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket non trouvé');
    }

    // USER ne peut accéder qu'à ses propres tickets
    if (user.role === UserRole.USER && ticket.createdByUserId !== user.id) {
      throw new ForbiddenException('Accès non autorisé à ce ticket');
    }

    return ticket;
  }

  /**
   * Crée un message sur un ticket
   */
  async create(ticketId: string, dto: CreateMessageDto, user: AuthenticatedUser) {
    // Vérifier l'accès au ticket
    await this.verifyTicketAccess(ticketId, user);

    // Créer le message
    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        ticketId,
        authorUserId: user.id,
        authorName: `${user.firstName} ${user.lastName}`,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Liste les messages d'un ticket (triés par createdAt asc)
   */
  async findAllByTicket(ticketId: string, user: AuthenticatedUser) {
    // Vérifier l'accès au ticket
    await this.verifyTicketAccess(ticketId, user);

    // Récupérer les messages
    const messages = await this.prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return messages;
  }
}
