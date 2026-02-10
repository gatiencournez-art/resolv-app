import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { QueryUsersDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CurrentUser, Roles } from '../auth/decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users
   * Liste des utilisateurs de l'organisation
   */
  @Get()
  async findAll(
    @Query() query: QueryUsersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findAll(query, user);
  }

  /**
   * GET /api/users/pending
   * Liste des utilisateurs en attente d'approbation
   */
  @Get('pending')
  async findPending(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findPending(user);
  }

  /**
   * GET /api/users/:id
   * Détail d'un utilisateur
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findOne(id, user);
  }

  /**
   * PATCH /api/users/:id/approve
   * Approuver un utilisateur (PENDING → ACTIVE)
   */
  @Patch(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.approve(id, user);
  }

  /**
   * PATCH /api/users/:id/role
   * Changer le rôle d'un utilisateur
   */
  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateRole(id, dto, user);
  }

  /**
   * PATCH /api/users/:id/status
   * Changer le statut d'un utilisateur (suspend/delete/reactivate)
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, dto, user);
  }
}
