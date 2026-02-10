import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, JoinDto, RefreshDto, UpdateProfileDto } from './dto';
import { JwtPayload } from '../common/types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register: Crée une nouvelle organisation + premier user (ADMIN, ACTIVE)
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Générer le slug depuis le nom de l'organisation
    const slug = this.generateSlug(dto.organizationName);

    // Vérifier si le slug existe déjà
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException('Une organisation avec ce nom existe déjà');
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Créer l'organisation et le premier utilisateur en transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Créer l'organisation
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
        },
      });

      // Vérifier si l'email existe déjà dans cette org (ne devrait pas arriver, mais sécurité)
      const existingUser = await tx.user.findUnique({
        where: {
          email_organizationId: {
            email: dto.email.toLowerCase(),
            organizationId: organization.id,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }

      // Créer le premier utilisateur (ADMIN + ACTIVE)
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    // Générer les tokens
    const tokens = await this.generateTokens(result.user);

    // Stocker le refresh token
    await this.storeRefreshToken(result.user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        status: result.user.status,
        organizationId: result.organization.id,
        organizationName: result.organization.name,
        organizationSlug: result.organization.slug,
      },
    };
  }

  /**
   * Join: Rejoindre une organisation existante (USER + PENDING)
   */
  async join(dto: JoinDto): Promise<{ message: string }> {
    // Trouver l'organisation par slug
    const organization = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug.toLowerCase() },
    });

    if (!organization) {
      throw new BadRequestException('Organisation introuvable');
    }

    // Vérifier si l'email existe déjà dans cette org
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email_organizationId: {
          email: dto.email.toLowerCase(),
          organizationId: organization.id,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà dans cette organisation');
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Créer l'utilisateur en PENDING
    await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.USER,
        status: UserStatus.PENDING,
        organizationId: organization.id,
      },
    });

    return {
      message: 'Votre demande a été envoyée. Un administrateur doit valider votre accès.',
    };
  }

  /**
   * Login: Authentifie un utilisateur
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Trouver l'organisation par slug
    const organization = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug.toLowerCase() },
    });

    if (!organization) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: {
        email_organizationId: {
          email: dto.email.toLowerCase(),
          organizationId: organization.id,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le statut
    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Compte supprimé');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Compte suspendu');
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException('Compte en attente de validation');
    }

    // Générer les tokens
    const tokens = await this.generateTokens(user);

    // Stocker le refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        organizationId: organization.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
      },
    };
  }

  /**
   * Refresh: Génère de nouveaux tokens
   */
  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    // Hasher le refresh token pour comparaison
    const tokenHash = this.hashToken(dto.refreshToken);

    // Trouver le refresh token en DB
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Vérifier l'expiration
    if (storedToken.expiresAt < new Date()) {
      // Supprimer le token expiré
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token expiré');
    }

    // Vérifier le statut de l'utilisateur
    if (storedToken.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Compte non actif');
    }

    // Supprimer l'ancien refresh token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Générer de nouveaux tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Stocker le nouveau refresh token
    await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Logout: Invalide le refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    // Supprimer le refresh token (ignore si non trouvé)
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  /**
   * Logout all: Invalide tous les refresh tokens d'un utilisateur
   */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * UpdateProfile: Met à jour le profil de l'utilisateur connecté
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ id: string; email: string; firstName: string; lastName: string; role: UserRole; status: UserStatus; organizationId: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    const updateData: { firstName?: string; lastName?: string; passwordHash?: string } = {};

    if (dto.firstName) {
      updateData.firstName = dto.firstName;
    }

    if (dto.lastName) {
      updateData.lastName = dto.lastName;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Le mot de passe actuel est requis');
      }

      const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      updateData.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Aucune modification fournie');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role,
      status: updated.status,
      organizationId: updated.organizationId,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async generateTokens(user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    organizationId: string;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.generateRefreshToken(),
    ]);

    return { accessToken, refreshToken };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }
}
