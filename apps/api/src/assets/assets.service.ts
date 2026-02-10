import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetType, AssetStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto } from './dto';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un asset (ADMIN only)
   */
  async create(dto: CreateAssetDto, organizationId: string) {
    return this.prisma.asset.create({
      data: {
        name: dto.name,
        type: dto.type,
        status: dto.status ?? AssetStatus.ACTIVE,
        serialNumber: dto.serialNumber,
        brand: dto.brand,
        model: dto.model,
        purchaseDate: dto.purchaseDate
          ? new Date(dto.purchaseDate)
          : undefined,
        notes: dto.notes,
        assignedToEmail: dto.assignedToEmail,
        organizationId,
      },
    });
  }

  /**
   * Lister les assets avec filtres
   */
  async findAll(
    organizationId: string,
    options?: {
      type?: AssetType;
      status?: AssetStatus;
      assignedToEmail?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Prisma.AssetWhereInput = { organizationId };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.assignedToEmail) {
      where.assignedToEmail = options.assignedToEmail;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { serialNumber: { contains: options.search, mode: 'insensitive' } },
        { brand: { contains: options.search, mode: 'insensitive' } },
        { model: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Récupérer un asset par ID
   */
  async findOne(id: string, organizationId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId },
    });

    if (!asset) {
      throw new NotFoundException('Asset non trouvé');
    }

    return asset;
  }

  /**
   * Mettre à jour un asset (ADMIN only)
   */
  async update(id: string, dto: UpdateAssetDto, organizationId: string) {
    await this.findOne(id, organizationId);

    const data: Prisma.AssetUpdateInput = { ...dto };

    if (dto.purchaseDate) {
      data.purchaseDate = new Date(dto.purchaseDate);
    }

    return this.prisma.asset.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un asset (ADMIN only)
   */
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.asset.delete({
      where: { id },
    });
  }
}
