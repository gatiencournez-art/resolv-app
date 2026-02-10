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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssetType, AssetStatus } from '@prisma/client';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CurrentUser, Roles } from '../auth/decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * POST /api/assets
   * Créer un asset (ADMIN only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body() dto: CreateAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assetsService.create(dto, user.organizationId);
  }

  /**
   * GET /api/assets
   * Lister les assets avec filtres
   */
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: AssetType,
    @Query('status') status?: AssetStatus,
    @Query('assignedToEmail') assignedToEmail?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.assetsService.findAll(user.organizationId, {
      type,
      status,
      assignedToEmail,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * GET /api/assets/:id
   * Récupérer un asset
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assetsService.findOne(id, user.organizationId);
  }

  /**
   * PATCH /api/assets/:id
   * Mettre à jour un asset (ADMIN only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assetsService.update(id, dto, user.organizationId);
  }

  /**
   * DELETE /api/assets/:id
   * Supprimer un asset (ADMIN only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.assetsService.remove(id, user.organizationId);
    return { message: 'Asset supprimé' };
  }
}
