import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TicketPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlaPolicyDto, UpdateSlaPolicyDto } from './dto';

@Injectable()
export class SlaPoliciesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une politique SLA (ADMIN only)
   * Une seule par priorité par organisation
   */
  async create(dto: CreateSlaPolicyDto, organizationId: string) {
    // Vérifier qu'il n'y a pas déjà une SLA pour cette priorité
    const existing = await this.prisma.slaPolicy.findUnique({
      where: {
        priority_organizationId: {
          priority: dto.priority,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Une politique SLA existe déjà pour la priorité ${dto.priority}`,
      );
    }

    return this.prisma.slaPolicy.create({
      data: {
        priority: dto.priority,
        responseTime: dto.responseTime,
        resolutionTime: dto.resolutionTime,
        organizationId,
      },
    });
  }

  /**
   * Lister toutes les SLA policies de l'organisation
   */
  async findAll(organizationId: string) {
    return this.prisma.slaPolicy.findMany({
      where: { organizationId },
      orderBy: { priority: 'asc' },
    });
  }

  /**
   * Récupérer une SLA par ID
   */
  async findOne(id: string, organizationId: string) {
    const policy = await this.prisma.slaPolicy.findFirst({
      where: { id, organizationId },
    });

    if (!policy) {
      throw new NotFoundException('Politique SLA non trouvée');
    }

    return policy;
  }

  /**
   * Récupérer la SLA pour une priorité donnée
   */
  async findByPriority(priority: TicketPriority, organizationId: string) {
    return this.prisma.slaPolicy.findUnique({
      where: {
        priority_organizationId: {
          priority,
          organizationId,
        },
      },
    });
  }

  /**
   * Mettre à jour une SLA policy (ADMIN only)
   */
  async update(id: string, dto: UpdateSlaPolicyDto, organizationId: string) {
    // Vérifier que la SLA existe et appartient à l'org
    await this.findOne(id, organizationId);

    return this.prisma.slaPolicy.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Supprimer une SLA policy (ADMIN only)
   */
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.slaPolicy.delete({
      where: { id },
    });
  }
}
