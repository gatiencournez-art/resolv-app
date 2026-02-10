// User roles within an organization
export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// User status
export const UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// Ticket type
export const TicketType = {
  SOFTWARE: 'SOFTWARE',
  HARDWARE: 'HARDWARE',
  ACCESS: 'ACCESS',
  ONBOARDING: 'ONBOARDING',
  OFFBOARDING: 'OFFBOARDING',
  OTHER: 'OTHER',
} as const;
export type TicketType = (typeof TicketType)[keyof typeof TicketType];

// Ticket status
export const TicketStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

// Ticket priority
export const TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

// Asset type
export const AssetType = {
  COMPUTER: 'COMPUTER',
  PHONE: 'PHONE',
  PRINTER: 'PRINTER',
  NETWORK: 'NETWORK',
  OTHER: 'OTHER',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

// Asset status
export const AssetStatus = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];
