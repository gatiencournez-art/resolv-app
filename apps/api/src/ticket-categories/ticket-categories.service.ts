import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketCategoryDto, UpdateTicketCategoryDto } from './dto';

const DEFAULT_CATEGORIES = [
  { name: 'Logiciel', color: '#6366f1', sortOrder: 0 },
  { name: 'Matériel', color: '#f97316', sortOrder: 1 },
  { name: 'Accès', color: '#10b981', sortOrder: 2 },
  { name: 'Intégration', color: '#3b82f6', sortOrder: 3 },
  { name: 'Départ', color: '#ef4444', sortOrder: 4 },
  { name: 'Autre', color: '#8b5cf6', sortOrder: 5 },
];

@Injectable()
export class TicketCategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste toutes les catégories de l'organisation.
   * Si aucune n'existe, crée les catégories par défaut.
   */
  async findAll(organizationId: string) {
    const categories = await this.prisma.ticketCategory.findMany({
      where: { organizationId },
      orderBy: { sortOrder: 'asc' },
    });

    if (categories.length === 0) {
      await this.prisma.ticketCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          organizationId,
        })),
      });

      return this.prisma.ticketCategory.findMany({
        where: { organizationId },
        orderBy: { sortOrder: 'asc' },
      });
    }

    return categories;
  }

  async findOne(id: string, organizationId: string) {
    const category = await this.prisma.ticketCategory.findFirst({
      where: { id, organizationId },
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    return category;
  }

  async create(dto: CreateTicketCategoryDto, organizationId: string) {
    const maxOrder = await this.prisma.ticketCategory.aggregate({
      where: { organizationId },
      _max: { sortOrder: true },
    });

    return this.prisma.ticketCategory.create({
      data: {
        name: dto.name,
        color: dto.color,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        organizationId,
      },
    });
  }

  async update(id: string, dto: UpdateTicketCategoryDto, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.ticketCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.ticketCategory.delete({
      where: { id },
    });
  }
}
