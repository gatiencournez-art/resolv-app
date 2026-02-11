import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TicketStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, QueryTicketsDto } from './dto';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée un ticket avec numérotation atomique (transaction)
   */
  async create(dto: CreateTicketDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      // Récupérer le dernier numéro de ticket pour cette org
      const lastTicket = await tx.ticket.findFirst({
        where: { organizationId: user.organizationId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });

      const nextNumber = (lastTicket?.number ?? 0) + 1;
      const key = `TCK-${nextNumber.toString().padStart(4, '0')}`;

      // Valider assignedAdminId si fourni
      if (dto.assignedAdminId) {
        const admin = await tx.user.findFirst({
          where: {
            id: dto.assignedAdminId,
            organizationId: user.organizationId,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
          },
        });
        if (!admin) {
          throw new BadRequestException('Administrateur non trouvé dans cette organisation');
        }
      }

      // Créer le ticket
      const ticket = await tx.ticket.create({
        data: {
          number: nextNumber,
          key,
          title: dto.title,
          description: dto.description,
          type: dto.type,
          priority: dto.priority,
          requesterFirstName: dto.requesterFirstName,
          requesterLastName: dto.requesterLastName,
          requesterEmail: dto.requesterEmail.toLowerCase(),
          organizationId: user.organizationId,
          createdByUserId: user.id,
          assignedAdminId: dto.assignedAdminId || null,
        },
        include: {
          createdBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          assignedAdmin: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      return ticket;
    });
  }

  /**
   * Liste les tickets (filtré par rôle)
   * - ADMIN : tous les tickets de l'org
   * - USER : uniquement ses tickets créés
   */
  async findAll(query: QueryTicketsDto, user: AuthenticatedUser) {
    const {
      status,
      priority,
      type,
      assignedAdminId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {
      organizationId: user.organizationId,
    };

    // Filtrage par rôle
    if (user.role === UserRole.USER) {
      where.createdByUserId = user.id;
    }

    // Filtres optionnels
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assignedAdminId) where.assignedAdminId = assignedAdminId;

    // Recherche texte
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { requesterEmail: { contains: search, mode: 'insensitive' } },
        { requesterFirstName: { contains: search, mode: 'insensitive' } },
        { requesterLastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Champs de tri autorisés
    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'key'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          assignedAdmin: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère un ticket par ID (tenant-safe)
   */
  async findOne(id: string, user: AuthenticatedUser) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        assignedAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, email: true, firstName: true, lastName: true, role: true },
            },
          },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket non trouvé');
    }

    // USER ne peut voir que ses propres tickets
    if (user.role === UserRole.USER && ticket.createdByUserId !== user.id) {
      throw new ForbiddenException('Accès non autorisé à ce ticket');
    }

    return ticket;
  }

  /**
   * Met à jour un ticket (champs métier uniquement, pas le status)
   */
  async update(id: string, dto: UpdateTicketDto, user: AuthenticatedUser) {
    // Vérifier l'accès au ticket
    const ticket = await this.findOne(id, user);

    // USER ne peut modifier que ses propres tickets
    if (user.role === UserRole.USER && ticket.createdByUserId !== user.id) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres tickets');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.requesterFirstName && { requesterFirstName: dto.requesterFirstName }),
        ...(dto.requesterLastName && { requesterLastName: dto.requesterLastName }),
        ...(dto.requesterEmail && { requesterEmail: dto.requesterEmail.toLowerCase() }),
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        assignedAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Assigne un ticket à un admin (ADMIN only)
   */
  async assign(id: string, assignedAdminId: string | null, user: AuthenticatedUser) {
    // Vérifier l'accès au ticket
    await this.findOne(id, user);

    // Vérifier que l'assigné existe et est ADMIN de la même org
    if (assignedAdminId) {
      const admin = await this.prisma.user.findFirst({
        where: {
          id: assignedAdminId,
          organizationId: user.organizationId,
          role: UserRole.ADMIN,
        },
      });

      if (!admin) {
        throw new NotFoundException('Admin non trouvé dans cette organisation');
      }
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { assignedAdminId },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        assignedAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Supprime un ticket (ADMIN only, cascade supprime messages/attachments/notifications)
   */
  async remove(id: string, user: AuthenticatedUser) {
    const ticket = await this.findOne(id, user);

    await this.prisma.ticket.delete({
      where: { id: ticket.id },
    });

    return { deleted: true };
  }

  /**
   * Ajoute une pièce jointe à un ticket
   */
  async addAttachment(ticketId: string, file: Express.Multer.File, user: AuthenticatedUser) {
    // Verify ticket exists and user has access
    await this.findOne(ticketId, user);

    return this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/api/uploads/${file.filename}`,
        ticketId,
      },
    });
  }

  /**
   * Change le statut d'un ticket
   */
  async updateStatus(id: string, status: TicketStatus, user: AuthenticatedUser) {
    // Vérifier l'accès au ticket
    const ticket = await this.findOne(id, user);

    // Préparer les données de mise à jour
    const updateData: any = { status };

    // Mettre à jour les timestamps selon le statut
    if (status === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (status === TicketStatus.CLOSED && !ticket.closedAt) {
      updateData.closedAt = new Date();
    }

    // Réouvrir un ticket : reset des timestamps
    if (status === TicketStatus.NEW || status === TicketStatus.IN_PROGRESS) {
      updateData.resolvedAt = null;
      updateData.closedAt = null;
    }

    return this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        assignedAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
