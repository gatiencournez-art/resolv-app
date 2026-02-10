'use client';

import { TicketWorkspaceProvider } from '@/contexts/ticket-workspace-context';
import { TicketViewsSidebar } from './ticket-views-sidebar';
import { TicketListPanel } from './ticket-list-panel';
import { TicketDetailPanel } from './ticket-detail-panel';
import { TicketDetailDrawer } from './ticket-detail-drawer';

export function TicketWorkspace() {
  return (
    <TicketWorkspaceProvider>
      <div className="flex h-[calc(100vh-3.5rem)] -m-6 overflow-hidden bg-surface-secondary">
        {/* Left: Views sidebar (desktop only) */}
        <TicketViewsSidebar className="hidden lg:flex" />

        {/* Center: Ticket list */}
        <TicketListPanel />

        {/* Right: Detail panel (desktop/tablet) */}
        <TicketDetailPanel className="hidden md:flex" />

        {/* Detail drawer (mobile) */}
        <TicketDetailDrawer className="md:hidden" />
      </div>
    </TicketWorkspaceProvider>
  );
}
