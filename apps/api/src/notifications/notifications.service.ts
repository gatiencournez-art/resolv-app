import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une notification
   */
  async create(data: {
    type: NotificationType;
    title: string;
    content: string;
    userId: string;
    organizationId: string;
    ticketId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  /**
   * Lister les notifications d'un utilisateur (paginé, plus récentes en premier)
   */
  async findAllByUser(
    userId: string,
    organizationId: string,
    options?: { onlyUnread?: boolean; limit?: number; offset?: number },
  ) {
    const where: Record<string, unknown> = { userId, organizationId };

    if (options?.onlyUnread) {
      where.read = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
        include: {
          ticket: { select: { id: true, key: true, title: true } },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Nombre de notifications non lues
   */
  async countUnread(userId: string, organizationId: string) {
    return this.prisma.notification.count({
      where: { userId, organizationId, read: false },
    });
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string, userId: string, organizationId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, organizationId },
      data: { read: true },
    });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string, organizationId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, organizationId, read: false },
      data: { read: true },
    });
  }

  /**
   * Supprimer une notification
   */
  async remove(id: string, userId: string, organizationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId, organizationId },
    });
  }

  // ============================================================================
  // HELPERS - à appeler depuis d'autres services
  // ============================================================================

  /**
   * Notifier les admins d'un nouveau ticket
   */
  async notifyTicketCreated(
    organizationId: string,
    ticketId: string,
    ticketKey: string,
    ticketTitle: string,
  ) {
    const admins = await this.prisma.user.findMany({
      where: { organizationId, role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        type: NotificationType.TICKET_CREATED,
        title: `Nouveau ticket ${ticketKey}`,
        content: ticketTitle,
        userId: admin.id,
        organizationId,
        ticketId,
      })),
    });
  }

  /**
   * Notifier un admin qu'un ticket lui a été assigné
   */
  async notifyTicketAssigned(
    adminId: string,
    organizationId: string,
    ticketId: string,
    ticketKey: string,
    ticketTitle: string,
  ) {
    await this.create({
      type: NotificationType.TICKET_ASSIGNED,
      title: `Ticket ${ticketKey} assigné`,
      content: ticketTitle,
      userId: adminId,
      organizationId,
      ticketId,
    });
  }

  /**
   * Notifier le créateur d'un changement de statut
   */
  async notifyTicketUpdated(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketKey: string,
    newStatus: string,
  ) {
    await this.create({
      type: NotificationType.TICKET_UPDATED,
      title: `Ticket ${ticketKey} mis à jour`,
      content: `Statut changé en ${newStatus}`,
      userId,
      organizationId,
      ticketId,
    });
  }

  /**
   * Notifier qu'un nouveau message a été ajouté
   */
  async notifyNewMessage(
    recipientUserId: string,
    organizationId: string,
    ticketId: string,
    ticketKey: string,
    authorName: string,
  ) {
    await this.create({
      type: NotificationType.TICKET_MESSAGE,
      title: `Nouveau message sur ${ticketKey}`,
      content: `Message de ${authorName}`,
      userId: recipientUserId,
      organizationId,
      ticketId,
    });
  }

  /**
   * Notifier un utilisateur que son compte a été approuvé
   */
  async notifyUserApproved(userId: string, organizationId: string) {
    await this.create({
      type: NotificationType.USER_APPROVED,
      title: 'Compte approuvé',
      content: 'Votre compte a été validé par un administrateur.',
      userId,
      organizationId,
    });
  }
}
