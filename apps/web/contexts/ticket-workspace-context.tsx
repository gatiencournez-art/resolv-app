'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { getAccessToken, isTokenExpired } from '@/lib/auth';
import type { Ticket, Message, TicketStatus, User } from '@/lib/types';

// ============================================================================
// TYPES
// ============================================================================

export type TicketView =
  | 'all'
  | 'my_tickets'
  | 'unassigned'
  | 'high_priority'
  | 'overdue'
  | 'new'
  | 'in_progress'
  | 'resolved';

export interface TicketFiltersState {
  statuses: string[];
  priorities: string[];
  types: string[];
  assignees: string[];
}

export interface TicketWorkspaceContextType {
  // Data
  allTickets: Ticket[];
  filteredTickets: Ticket[];
  admins: User[];
  selectedTicketId: string | null;
  selectedTicket: Ticket | null;
  messages: Message[];

  // View state
  activeView: TicketView;
  search: string;
  filters: TicketFiltersState;

  // Loading
  isLoadingList: boolean;
  isLoadingDetail: boolean;

  // View counts
  viewCounts: Record<TicketView, number>;

  // Actions
  selectTicket: (id: string | null) => void;
  setActiveView: (view: TicketView) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: TicketFiltersState) => void;
  refreshTickets: () => Promise<void>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
  assignTicket: (id: string, adminId: string | null) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteTicket: (id: string) => Promise<boolean>;
}

const TicketWorkspaceContext = createContext<TicketWorkspaceContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export function useTicketWorkspace() {
  const ctx = useContext(TicketWorkspaceContext);
  if (!ctx) throw new Error('useTicketWorkspace must be used within TicketWorkspaceProvider');
  return ctx;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function TicketWorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAdminView, refreshAuth } = useAuth();

  // Data
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // View / Filter state
  const [activeView, setActiveView] = useState<TicketView>('all');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TicketFiltersState>({
    statuses: [],
    priorities: [],
    types: [],
    assignees: [],
  });

  // Loading
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Read URL query params (for click-to-filter from /accueil stat cards)
  const searchParams = useSearchParams();
  const lastParamsKey = useRef('');

  useEffect(() => {
    const paramsKey = searchParams.toString();
    // Skip if params haven't changed (avoids re-triggering on same page)
    if (paramsKey === lastParamsKey.current) return;
    lastParamsKey.current = paramsKey;

    // If no filter params, don't override current view
    const statusParam = searchParams.get('status');
    const viewParam = searchParams.get('view');
    const typeParam = searchParams.get('type');
    const priorityParam = searchParams.get('priority');
    const slaParam = searchParams.get('sla');

    if (!statusParam && !viewParam && !typeParam && !priorityParam && !slaParam) return;

    if (slaParam === 'overdue' || viewParam === 'overdue') {
      setActiveView('overdue');
    } else if (viewParam === 'high_priority') {
      setActiveView('high_priority');
    } else if (priorityParam) {
      if (priorityParam === 'HIGH' || priorityParam === 'CRITICAL') {
        setActiveView('high_priority');
      } else {
        setActiveView('all');
        setFilters({ statuses: [], priorities: [priorityParam as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'], types: [], assignees: [] });
      }
    } else if (typeParam) {
      setActiveView('all');
      setFilters({ statuses: [], priorities: [], types: [typeParam as 'SOFTWARE' | 'HARDWARE' | 'ACCESS' | 'ONBOARDING' | 'OFFBOARDING' | 'OTHER'], assignees: [] });
    } else if (statusParam) {
      const statusViewMap: Record<string, TicketView> = {
        NEW: 'new',
        IN_PROGRESS: 'in_progress',
        RESOLVED: 'resolved',
      };
      const mapped = statusViewMap[statusParam];
      if (mapped) {
        setActiveView(mapped);
      } else if (statusParam === 'ON_HOLD') {
        setActiveView('all');
        setFilters({ statuses: ['ON_HOLD'], priorities: [], types: [], assignees: [] });
      } else if (statusParam === 'CLOSED') {
        setActiveView('all');
        setFilters({ statuses: ['CLOSED'], priorities: [], types: [], assignees: [] });
      }
    }
  }, [searchParams]);

  // ------------------------------------------------------------------
  // Fetch all tickets
  // ------------------------------------------------------------------
  const getValidToken = useCallback(async (): Promise<string | null> => {
    let token = getAccessToken();
    if (!token) return null;
    if (isTokenExpired(token)) {
      const refreshed = await refreshAuth();
      if (!refreshed) return null;
      token = getAccessToken();
    }
    return token;
  }, [refreshAuth]);

  const fetchTickets = useCallback(async () => {
    const token = await getValidToken();
    if (!token) return;
    try {
      const res = (await api.getTickets(token, { limit: '100' })) as { data: Ticket[] };
      setAllTickets(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingList(false);
    }
  }, [getValidToken]);

  // ------------------------------------------------------------------
  // Fetch admins (for assignment)
  // ------------------------------------------------------------------
  const fetchAdmins = useCallback(async () => {
    if (!isAdminView) return;
    const token = await getValidToken();
    if (!token) return;
    try {
      const res = (await api.getUsers(token, { limit: '100' })) as { data: User[] };
      setAdmins((res.data || []).filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE'));
    } catch {
      /* ignore */
    }
  }, [isAdminView, getValidToken]);

  // ------------------------------------------------------------------
  // Fetch ticket detail + messages
  // ------------------------------------------------------------------
  const fetchDetail = useCallback(async (id: string) => {
    const token = await getValidToken();
    if (!token) return;
    setIsLoadingDetail(true);
    try {
      const data = (await api.getTicket(id, token)) as Ticket;
      setSelectedTicket(data);
      setMessages(data.messages || []);
    } catch {
      setSelectedTicket(null);
      setMessages([]);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [getValidToken]);

  // ------------------------------------------------------------------
  // Polling: list every 15s
  // ------------------------------------------------------------------
  useEffect(() => {
    fetchTickets();
    fetchAdmins();
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, [fetchTickets, fetchAdmins]);

  // ------------------------------------------------------------------
  // Polling: detail every 10s
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!selectedTicketId) return;
    fetchDetail(selectedTicketId);
    const interval = setInterval(() => fetchDetail(selectedTicketId), 10000);
    return () => clearInterval(interval);
  }, [selectedTicketId, fetchDetail]);

  // ------------------------------------------------------------------
  // Select ticket
  // ------------------------------------------------------------------
  const selectTicket = useCallback((id: string | null) => {
    setSelectedTicketId(id);
    if (!id) {
      setSelectedTicket(null);
      setMessages([]);
    }
  }, []);

  // ------------------------------------------------------------------
  // Change view (resets filters)
  // ------------------------------------------------------------------
  const handleSetActiveView = useCallback((view: TicketView) => {
    setActiveView(view);
    setFilters({ statuses: [], priorities: [], types: [], assignees: [] });
  }, []);

  // ------------------------------------------------------------------
  // Update ticket in list (optimistic-like sync)
  // ------------------------------------------------------------------
  const updateTicketInList = useCallback((id: string, updates: Partial<Ticket>) => {
    setAllTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  // ------------------------------------------------------------------
  // Update ticket status
  // ------------------------------------------------------------------
  const handleUpdateStatus = useCallback(
    async (id: string, status: TicketStatus) => {
      const token = await getValidToken();
      if (!token) return;
      try {
        const updated = (await api.updateTicketStatus(id, status, token)) as Ticket;
        const patch = { status: updated.status, resolvedAt: updated.resolvedAt, closedAt: updated.closedAt };
        updateTicketInList(id, patch);
        if (selectedTicket?.id === id) {
          setSelectedTicket((prev) => (prev ? { ...prev, ...patch } : prev));
        }
      } catch {
        /* ignore */
      }
    },
    [selectedTicket?.id, updateTicketInList, getValidToken]
  );

  // ------------------------------------------------------------------
  // Assign ticket
  // ------------------------------------------------------------------
  const handleAssign = useCallback(
    async (id: string, adminId: string | null) => {
      const token = await getValidToken();
      if (!token) return;
      try {
        const updated = (await api.assignTicket(id, adminId, token)) as Ticket;
        const patch = { assignedAdminId: updated.assignedAdminId, assignedAdmin: updated.assignedAdmin };
        updateTicketInList(id, patch);
        if (selectedTicket?.id === id) {
          setSelectedTicket((prev) => (prev ? { ...prev, ...patch } : prev));
        }
      } catch {
        /* ignore */
      }
    },
    [selectedTicket?.id, updateTicketInList, getValidToken]
  );

  // ------------------------------------------------------------------
  // Send message
  // ------------------------------------------------------------------
  const handleSendMessage = useCallback(
    async (content: string) => {
      const token = await getValidToken();
      if (!token || !selectedTicketId) return;
      const newMessage = (await api.createMessage(selectedTicketId, content, token)) as Message;
      setMessages((prev) => [...prev, newMessage]);
    },
    [selectedTicketId, getValidToken]
  );

  // ------------------------------------------------------------------
  // Delete ticket (admin only)
  // ------------------------------------------------------------------
  const handleDeleteTicket = useCallback(
    async (id: string): Promise<boolean> => {
      const token = await getValidToken();
      if (!token) return false;
      try {
        await api.deleteTicket(id, token);
        // Remove from list
        setAllTickets((prev) => prev.filter((t) => t.id !== id));
        // Clear selection if deleted ticket was selected
        if (selectedTicketId === id) {
          setSelectedTicketId(null);
          setSelectedTicket(null);
          setMessages([]);
        }
        return true;
      } catch {
        return false;
      }
    },
    [selectedTicketId, getValidToken]
  );

  // ------------------------------------------------------------------
  // Computed: view counts
  // ------------------------------------------------------------------
  const viewCounts = useMemo<Record<TicketView, number>>(() => {
    const uid = user?.id;
    // En mode utilisateur, on ne compte que ses propres tickets
    const baseTickets = isAdminView ? allTickets : allTickets.filter((t) => t.createdByUserId === uid);

    return {
      all: baseTickets.length,
      my_tickets: baseTickets.filter((t) =>
        isAdminView ? t.assignedAdminId === uid : t.createdByUserId === uid
      ).length,
      unassigned: baseTickets.filter((t) => !t.assignedAdminId).length,
      high_priority: baseTickets.filter(
        (t) => t.priority === 'HIGH' || t.priority === 'CRITICAL'
      ).length,
      overdue: baseTickets.filter((t) => t.slaBreachedAt !== null).length,
      new: baseTickets.filter((t) => t.status === 'NEW').length,
      in_progress: baseTickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: baseTickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length,
    };
  }, [allTickets, user?.id, isAdminView]);

  // ------------------------------------------------------------------
  // Computed: filtered tickets
  // ------------------------------------------------------------------
  const filteredTickets = useMemo(() => {
    const uid = user?.id;
    let result = [...allTickets];

    // En mode utilisateur (non-admin), on ne voit que ses propres tickets
    if (!isAdminView) {
      result = result.filter((t) => t.createdByUserId === uid);
    }

    // Apply view filter
    switch (activeView) {
      case 'my_tickets':
        result = result.filter((t) =>
          isAdminView ? t.assignedAdminId === uid : t.createdByUserId === uid
        );
        break;
      case 'unassigned':
        result = result.filter((t) => !t.assignedAdminId);
        break;
      case 'high_priority':
        result = result.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL');
        break;
      case 'overdue':
        result = result.filter((t) => t.slaBreachedAt !== null);
        break;
      case 'new':
        result = result.filter((t) => t.status === 'NEW');
        break;
      case 'in_progress':
        result = result.filter((t) => t.status === 'IN_PROGRESS');
        break;
      case 'resolved':
        result = result.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
        break;
    }

    // Apply manual filters
    if (filters.statuses.length > 0) {
      result = result.filter((t) => filters.statuses.includes(t.status));
    }
    if (filters.priorities.length > 0) {
      result = result.filter((t) => filters.priorities.includes(t.priority));
    }
    if (filters.types.length > 0) {
      result = result.filter((t) => filters.types.includes(t.type));
    }
    if (filters.assignees.length > 0) {
      result = result.filter((t) => {
        if (filters.assignees.includes('__unassigned__')) {
          return !t.assignedAdminId || filters.assignees.includes(t.assignedAdminId || '');
        }
        return filters.assignees.includes(t.assignedAdminId || '');
      });
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.key?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          `${t.requesterFirstName} ${t.requesterLastName}`.toLowerCase().includes(q)
      );
    }

    // Sort: newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [allTickets, activeView, search, filters, user?.id, isAdminView]);

  // ------------------------------------------------------------------
  // Context value
  // ------------------------------------------------------------------
  const value = useMemo<TicketWorkspaceContextType>(
    () => ({
      allTickets,
      filteredTickets,
      admins,
      selectedTicketId,
      selectedTicket,
      messages,
      activeView,
      search,
      filters,
      isLoadingList,
      isLoadingDetail,
      viewCounts,
      selectTicket,
      setActiveView: handleSetActiveView,
      setSearch,
      setFilters,
      refreshTickets: fetchTickets,
      updateTicketStatus: handleUpdateStatus,
      assignTicket: handleAssign,
      sendMessage: handleSendMessage,
      deleteTicket: handleDeleteTicket,
    }),
    [
      allTickets, filteredTickets, admins, selectedTicketId, selectedTicket, messages,
      activeView, search, filters, isLoadingList, isLoadingDetail, viewCounts,
      selectTicket, handleSetActiveView, fetchTickets, handleUpdateStatus, handleAssign, handleSendMessage, handleDeleteTicket,
    ]
  );

  return (
    <TicketWorkspaceContext.Provider value={value}>
      {children}
    </TicketWorkspaceContext.Provider>
  );
}
