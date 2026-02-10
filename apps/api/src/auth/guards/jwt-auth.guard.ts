import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: Error | null, user: any, info: Error | null, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }

    // Vérifier que l'utilisateur est actif
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Compte non actif');
    }

    return user;
  }
}
