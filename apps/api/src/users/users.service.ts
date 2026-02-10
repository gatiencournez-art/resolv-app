import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUsersDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste les utilisateurs de l'organisation
   */
  async findAll(query: QueryUsersDto, currentUser: AuthenticatedUser) {
    const { role, status, search, page = 1, limit = 20 } = query;

    const where: any = {
      organizationId: currentUser.organizationId,
    };

    if (role) where.role = role;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Liste les utilisateurs en attente d'approbation
   */
  async findPending(currentUser: AuthenticatedUser) {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId: currentUser.organizationId,
        status: UserStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return users;
  }

  /**
   * Récupère un utilisateur par ID
   */
  async findOne(id: string, currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId: currentUser.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Approuve un utilisateur (PENDING → ACTIVE)
   */
  async approve(id: string, currentUser: AuthenticatedUser) {
    const user = await this.findOne(id, currentUser);

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException("Cet utilisateur n'est pas en attente d'approbation");
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Change le rôle d'un utilisateur
   */
  async updateRole(id: string, dto: UpdateUserRoleDto, currentUser: AuthenticatedUser) {
    // Vérifier que l'utilisateur existe dans l'org
    await this.findOne(id, currentUser);

    // Un admin ne peut pas changer son propre rôle
    if (id === currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez pas modifier votre propre rôle');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Change le statut d'un utilisateur (suspend/delete/reactivate)
   */
  async updateStatus(id: string, dto: UpdateUserStatusDto, currentUser: AuthenticatedUser) {
    // Vérifier que l'utilisateur existe dans l'org
    const user = await this.findOne(id, currentUser);

    // Un admin ne peut pas changer son propre statut
    if (id === currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez pas modifier votre propre statut');
    }

    // Validation des transitions de statut
    if (dto.status === UserStatus.PENDING) {
      throw new BadRequestException('Impossible de remettre un utilisateur en statut PENDING');
    }

    // Si on supprime, invalider tous les refresh tokens
    if (dto.status === UserStatus.DELETED || dto.status === UserStatus.SUSPENDED) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: id },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }
}
