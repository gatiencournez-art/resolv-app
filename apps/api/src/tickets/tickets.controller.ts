import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  QueryTicketsDto,
  AssignTicketDto,
  UpdateStatusDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CurrentUser, Roles } from '../auth/decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * POST /api/tickets
   * Créer un nouveau ticket
   */
  @Post()
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.create(dto, user);
  }

  /**
   * GET /api/tickets
   * Liste des tickets (filtré par rôle)
   */
  @Get()
  async findAll(
    @Query() query: QueryTicketsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.findAll(query, user);
  }

  /**
   * GET /api/tickets/:id
   * Détail d'un ticket
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.findOne(id, user);
  }

  /**
   * PATCH /api/tickets/:id
   * Modifier un ticket (champs métier uniquement, pas le status)
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.update(id, dto, user);
  }

  /**
   * PATCH /api/tickets/:id/assign
   * Assigner un ticket à un admin (ADMIN only)
   */
  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.assign(id, dto.assignedAdminId, user);
  }

  /**
   * PATCH /api/tickets/:id/status
   * Changer le statut d'un ticket
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.updateStatus(id, dto.status, user);
  }

  /**
   * DELETE /api/tickets/:id
   * Supprimer un ticket (ADMIN only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.remove(id, user);
  }
}
