// User types
export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Ticket types
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketType = 'SOFTWARE' | 'HARDWARE' | 'ACCESS' | 'ONBOARDING' | 'OFFBOARDING' | 'OTHER';

export interface Ticket {
  id: string;
  number: number;
  key: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  requesterFirstName: string;
  requesterLastName: string;
  requesterEmail: string;
  organizationId: string;
  createdByUserId: string | null;
  assignedAdminId: string | null;
  slaBreachedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: User | null;
  assignedAdmin?: User | null;
  messages?: Message[];
  attachments?: Attachment[];
}

// Message types
export interface Message {
  id: string;
  content: string;
  ticketId: string;
  authorUserId: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User | null;
}

// Attachment types
export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  ticketId: string;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TicketsResponse extends PaginatedResponse<Ticket> {}
