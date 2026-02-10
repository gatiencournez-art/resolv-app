import { getValidAccessToken, clearTokens } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions extends RequestInit {
  token?: string;
  /** Skip auto-refresh logic (used internally for auth endpoints) */
  _skipAuth?: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const { token, _skipAuth, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // On 401, try to refresh token once and retry (unless this is an auth endpoint)
    if (response.status === 401 && token && !_skipAuth) {
      const newToken = await getValidAccessToken();
      if (newToken && newToken !== token) {
        // Retry with new token (single attempt)
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers: retryHeaders,
        });

        const retryText = await retryResponse.text();
        const retryData = retryText ? JSON.parse(retryText) : null;
        if (!retryResponse.ok) {
          if (retryResponse.status === 401) {
            clearTokens();
          }
          const error: ApiError = {
            message: (retryData && retryData.message) || 'Une erreur est survenue',
            statusCode: retryResponse.status,
          };
          throw error;
        }
        return retryData as T;
      }

      // Refresh failed or returned same token → unauthenticated
      clearTokens();
      const error: ApiError = {
        message: 'Session expirée',
        statusCode: 401,
      };
      throw error;
    }

    // Handle empty responses (e.g. 204 No Content from DELETE)
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const error: ApiError = {
        message: (data && data.message) || 'Une erreur est survenue',
        statusCode: response.status,
      };
      throw error;
    }

    return data as T;
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async join(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationSlug: string;
  }) {
    return this.request('/auth/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string; organizationSlug: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refresh(refreshToken: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      _skipAuth: true,
    });
  }

  async logout(refreshToken: string, token: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      token,
      _skipAuth: true,
    });
  }

  async getMe(token: string) {
    return this.request('/auth/me', { token });
  }

  async updateProfile(data: { firstName?: string; lastName?: string; currentPassword?: string; newPassword?: string }, token: string) {
    return this.request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  // Tickets
  async getTickets(token: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/tickets${query}`, { token });
  }

  async getTicket(id: string, token: string) {
    return this.request(`/tickets/${id}`, { token });
  }

  async createTicket(data: Record<string, unknown>, token: string) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateTicket(id: string, data: Record<string, unknown>, token: string) {
    return this.request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateTicketStatus(id: string, status: string, token: string) {
    return this.request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }

  async assignTicket(id: string, assignedAdminId: string | null, token: string) {
    return this.request(`/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedAdminId }),
      token,
    });
  }

  async deleteTicket(id: string, token: string) {
    return this.request(`/tickets/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Messages
  async getMessages(ticketId: string, token: string) {
    return this.request(`/tickets/${ticketId}/messages`, { token });
  }

  async createMessage(ticketId: string, content: string, token: string) {
    return this.request(`/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      token,
    });
  }

  // Users (Admin)
  async getUsers(token: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/users${query}`, { token });
  }

  async getPendingUsers(token: string) {
    return this.request('/users/pending', { token });
  }

  async approveUser(id: string, token: string) {
    return this.request(`/users/${id}/approve`, {
      method: 'PATCH',
      token,
    });
  }

  async updateUserRole(id: string, role: string, token: string) {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      token,
    });
  }

  async updateUserStatus(id: string, status: string, token: string) {
    return this.request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }
}

export const api = new ApiClient(API_URL);
