import { UserRole, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string;
  firstName: string;
  lastName: string;
}
