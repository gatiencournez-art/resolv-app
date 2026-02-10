import { Controller, Post, Get, Patch, Body, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, JoinDto, RefreshDto, UpdateProfileDto } from './dto';
import { JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import { AuthenticatedUser } from '../common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Crée une nouvelle organisation + premier utilisateur (ADMIN, ACTIVE)
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/join
   * Rejoindre une organisation existante (USER + PENDING)
   */
  @Post('join')
  async join(@Body() dto: JoinDto) {
    return this.authService.join(dto);
  }

  /**
   * POST /api/auth/login
   * Authentifie un utilisateur
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/auth/refresh
   * Rafraîchit les tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    try {
      return await this.authService.refresh(dto);
    } catch (error) {
      // If it's already an HTTP exception (UnauthorizedException etc.), rethrow as-is
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Any unexpected error (Prisma, etc.) → log + return 401 instead of 500
      console.error('[Auth] Refresh token error:', error);
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  /**
   * POST /api/auth/logout
   * Invalide le refresh token
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Déconnexion réussie' };
  }

  /**
   * GET /api/auth/me
   * Retourne le profil de l'utilisateur authentifié
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
    };
  }

  /**
   * PATCH /api/auth/me
   * Met à jour le profil de l'utilisateur authentifié
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
