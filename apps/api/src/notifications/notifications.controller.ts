import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /api/notifications
   * Liste les notifications de l'utilisateur connecté
   */
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.findAllByUser(
      user.id,
      user.organizationId,
      {
        onlyUnread: unread === 'true',
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      },
    );
  }

  /**
   * GET /api/notifications/unread-count
   * Nombre de notifications non lues
   */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.countUnread(
      user.id,
      user.organizationId,
    );
    return { count };
  }

  /**
   * PATCH /api/notifications/:id/read
   * Marquer une notification comme lue
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.notificationsService.markAsRead(
      id,
      user.id,
      user.organizationId,
    );
    return { message: 'Notification marquée comme lue' };
  }

  /**
   * PATCH /api/notifications/read-all
   * Marquer toutes les notifications comme lues
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markAllAsRead(
      user.id,
      user.organizationId,
    );
    return { message: 'Toutes les notifications marquées comme lues' };
  }

  /**
   * DELETE /api/notifications/:id
   * Supprimer une notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.notificationsService.remove(
      id,
      user.id,
      user.organizationId,
    );
    return { message: 'Notification supprimée' };
  }
}
