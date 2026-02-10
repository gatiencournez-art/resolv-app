import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('tickets/:ticketId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * POST /api/tickets/:ticketId/messages
   * Créer un message sur un ticket
   */
  @Post()
  async create(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagesService.create(ticketId, dto, user);
  }

  /**
   * GET /api/tickets/:ticketId/messages
   * Liste des messages d'un ticket (triés par createdAt asc)
   */
  @Get()
  async findAll(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagesService.findAllByTicket(ticketId, user);
  }
}
