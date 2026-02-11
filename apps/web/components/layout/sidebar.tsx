'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

// ============================================================================
// ORGANIZATION NAME
// ============================================================================

function OrganizationName() {
  const { user } = useAuth();

  if (!user?.organizationName) return null;

  return (
    <span className="text-[10px] text-sidebar-text truncate max-w-[120px]">
      {user.organizationName}
    </span>
  );
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

// ============================================================================
// ICONS (thinner, 18px, consistent)
// ============================================================================

function KanbanIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function TicketsIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ============================================================================
// NAV CONFIG
// ============================================================================

const adminSupportNav: NavItem[] = [
  { name: 'Accueil', href: '/accueil', icon: <HomeIcon /> },
  { name: 'Tous les tickets', href: '/tickets', icon: <TicketsIcon /> },
  { name: 'Kanban', href: '/kanban', icon: <KanbanIcon /> },
];

const adminAdministrationNav: NavItem[] = [
  { name: 'Utilisateurs', href: '/users', icon: <UsersIcon /> },
];

const userNav: NavItem[] = [
  { name: 'Accueil', href: '/accueil', icon: <HomeIcon /> },
  { name: 'Mes tickets', href: '/tickets', icon: <TicketsIcon /> },
  { name: 'Nouveau ticket', href: '/tickets/new', icon: <PlusIcon /> },
];

const bottomNav: NavItem[] = [
  { name: 'Aide', href: '/help', icon: <HelpIcon /> },
  { name: 'Paramètres', href: '/settings', icon: <SettingsIcon /> },
];

// ============================================================================
// NAV LINK
// ============================================================================

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  // Exact match uniquement — pas de "startsWith" pour éviter les conflits
  const isActive = pathname === item.href;

  return (
    <li>
      <Link
        href={item.href}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
          ${isActive
            ? 'bg-accent text-white shadow-sm shadow-accent/25'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
          }
        `}
      >
        {item.icon}
        {item.name}
      </Link>
    </li>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mt-7 mb-2 px-3">
      <p className="text-[10px] font-bold text-sidebar-text uppercase tracking-[0.15em] pl-1 border-l-2 border-sidebar-text/50">
        {label}
      </p>
    </div>
  );
}

// ============================================================================
// SIDEBAR
// ============================================================================

export function Sidebar() {
  const pathname = usePathname();
  const { isAdminView } = useAuth();

  return (
    <aside className="w-60 bg-sidebar-bg min-h-screen flex flex-col border-r border-sidebar-border">
      {/* Logo + Organization */}
      <div className="px-5 py-5">
        <Link href="/accueil" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-sidebar-text-active tracking-tight">
              Resolv
            </span>
            <OrganizationName />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col">
        <div className="flex-1">
          {isAdminView ? (
            <>
              <SectionLabel label="Support" />
              <ul className="space-y-0.5">
                {adminSupportNav.map((item) => (
                  <NavLink key={item.name} item={item} pathname={pathname} />
                ))}
              </ul>

              <SectionLabel label="Administration" />
              <ul className="space-y-0.5">
                {adminAdministrationNav.map((item) => (
                  <NavLink key={item.name} item={item} pathname={pathname} />
                ))}
              </ul>
            </>
          ) : (
            <ul className="mt-4 space-y-1">
              {userNav.map((item) => (
                <NavLink key={item.name} item={item} pathname={pathname} />
              ))}
            </ul>
          )}
        </div>

        {/* Bottom nav */}
        <ul className="space-y-0.5 border-t border-sidebar-border pt-3 mb-4">
          {bottomNav.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>

    </aside>
  );
}
