import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SlaPoliciesService } from './sla-policies.service';
import { CreateSlaPolicyDto, UpdateSlaPolicyDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CurrentUser, Roles } from '../auth/decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('sla-policies')
@UseGuards(JwtAuthGuard)
export class SlaPoliciesController {
  constructor(private readonly slaPoliciesService: SlaPoliciesService) {}

  /**
   * POST /api/sla-policies
   * Créer une politique SLA (ADMIN only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body() dto: CreateSlaPolicyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.slaPoliciesService.create(dto, user.organizationId);
  }

  /**
   * GET /api/sla-policies
   * Lister toutes les SLA policies
   */
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.slaPoliciesService.findAll(user.organizationId);
  }

  /**
   * GET /api/sla-policies/:id
   * Récupérer une SLA policy
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.slaPoliciesService.findOne(id, user.organizationId);
  }

  /**
   * PATCH /api/sla-policies/:id
   * Mettre à jour une SLA policy (ADMIN only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSlaPolicyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.slaPoliciesService.update(id, dto, user.organizationId);
  }

  /**
   * DELETE /api/sla-policies/:id
   * Supprimer une SLA policy (ADMIN only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.slaPoliciesService.remove(id, user.organizationId);
    return { message: 'Politique SLA supprimée' };
  }
}
