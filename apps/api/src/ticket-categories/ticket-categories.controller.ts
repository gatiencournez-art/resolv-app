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
import { TicketCategoriesService } from './ticket-categories.service';
import { CreateTicketCategoryDto, UpdateTicketCategoryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CurrentUser, Roles } from '../auth/decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('ticket-categories')
@UseGuards(JwtAuthGuard)
export class TicketCategoriesController {
  constructor(private readonly ticketCategoriesService: TicketCategoriesService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ticketCategoriesService.findAll(user.organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body() dto: CreateTicketCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketCategoriesService.create(dto, user.organizationId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketCategoriesService.update(id, dto, user.organizationId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.ticketCategoriesService.remove(id, user.organizationId);
    return { message: 'Catégorie supprimée' };
  }
}
