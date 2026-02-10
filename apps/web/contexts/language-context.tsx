'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type Language = 'fr' | 'en';

export interface Translations {
  // Common
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  loading: string;
  noResults: string;

  // Navigation
  allTickets: string;
  myTickets: string;
  kanban: string;
  users: string;
  newTicket: string;
  help: string;
  settings: string;

  // User roles
  admin: string;
  user: string;

  // User status
  pending: string;
  active: string;
  suspended: string;
  rejected: string;
  deleted: string;

  // Ticket status
  new: string;
  inProgress: string;
  onHold: string;
  resolved: string;
  closed: string;

  // Ticket priority
  low: string;
  medium: string;
  high: string;
  critical: string;

  // Settings
  profile: string;
  theme: string;
  preferences: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  language: string;
  notifications: string;
  appearance: string;
  light: string;
  dark: string;
  system: string;
  accentColor: string;
  density: string;
  comfortable: string;
  compact: string;
  animations: string;

  // User management
  userManagement: string;
  assignRoles: string;
  approve: string;
  reject: string;
  suspend: string;
  reactivate: string;
  pendingUsers: string;
  rejectedUsers: string;
  suspendedUsers: string;
  noUsers: string;
  noPendingUsers: string;
  noRejectedUsers: string;
  noSuspendedUsers: string;

  // Actions confirmations
  approveUserTitle: string;
  approveUserMessage: string;
  approveUserDetail: string;
  rejectUserTitle: string;
  rejectUserMessage: string;
  rejectUserDetail: string;
  suspendUserTitle: string;
  suspendUserMessage: string;
  suspendUserDetail: string;
  reactivateUserTitle: string;
  reactivateUserMessage: string;
  reactivateUserDetail: string;
  changeRoleTitle: string;
  changeRoleMessage: string;
  changeRoleAdminDetail: string;
  changeRoleUserDetail: string;
}

const translations: Record<Language, Translations> = {
  fr: {
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    loading: 'Chargement...',
    noResults: 'Aucun résultat',

    // Navigation
    allTickets: 'Tous les tickets',
    myTickets: 'Mes tickets',
    kanban: 'Kanban',
    users: 'Utilisateurs',
    newTicket: 'Nouveau ticket',
    help: 'Aide',
    settings: 'Paramètres',

    // User roles
    admin: 'Administrateur',
    user: 'Utilisateur',

    // User status
    pending: 'En attente',
    active: 'Actif',
    suspended: 'Suspendu',
    rejected: 'Refusé',
    deleted: 'Supprimé',

    // Ticket status
    new: 'Nouveau',
    inProgress: 'En cours',
    onHold: 'En attente',
    resolved: 'Résolu',
    closed: 'Fermé',

    // Ticket priority
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    critical: 'Critique',

    // Settings
    profile: 'Profil',
    theme: 'Thème',
    preferences: 'Préférences',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    password: 'Mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    language: 'Langue',
    notifications: 'Notifications',
    appearance: 'Apparence',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    accentColor: 'Couleur d\'accent',
    density: 'Densité d\'affichage',
    comfortable: 'Confort',
    compact: 'Compact',
    animations: 'Animations',

    // User management
    userManagement: 'Gestion des utilisateurs',
    assignRoles: 'Attribuez les rôles et gérez les accès',
    approve: 'Approuver',
    reject: 'Refuser',
    suspend: 'Suspendre',
    reactivate: 'Réactiver',
    pendingUsers: 'En attente',
    rejectedUsers: 'Refusés',
    suspendedUsers: 'Suspendus',
    noUsers: 'Aucun utilisateur',
    noPendingUsers: 'Aucun utilisateur en attente',
    noRejectedUsers: 'Aucun utilisateur refusé',
    noSuspendedUsers: 'Aucun utilisateur suspendu',

    // Actions confirmations
    approveUserTitle: 'Approuver l\'utilisateur',
    approveUserMessage: 'Voulez-vous approuver',
    approveUserDetail: 'L\'utilisateur pourra accéder à la plateforme et créer des tickets.',
    rejectUserTitle: 'Refuser l\'utilisateur',
    rejectUserMessage: 'Voulez-vous refuser',
    rejectUserDetail: 'L\'utilisateur recevra un message de demande non approuvée mais pourra réessayer de rejoindre l\'organisation.',
    suspendUserTitle: 'Suspendre l\'utilisateur',
    suspendUserMessage: 'Voulez-vous suspendre',
    suspendUserDetail: 'L\'utilisateur ne pourra plus se connecter ni accéder à la plateforme.',
    reactivateUserTitle: 'Réactiver l\'utilisateur',
    reactivateUserMessage: 'Voulez-vous réactiver',
    reactivateUserDetail: 'L\'utilisateur pourra à nouveau se connecter et accéder à la plateforme.',
    changeRoleTitle: 'Changer le rôle',
    changeRoleMessage: 'Changer le rôle de',
    changeRoleAdminDetail: 'L\'utilisateur aura accès à toutes les fonctionnalités d\'administration.',
    changeRoleUserDetail: 'L\'utilisateur perdra ses droits d\'administration.',
  },
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    noResults: 'No results',

    // Navigation
    allTickets: 'All tickets',
    myTickets: 'My tickets',
    kanban: 'Kanban',
    users: 'Users',
    newTicket: 'New ticket',
    help: 'Help',
    settings: 'Settings',

    // User roles
    admin: 'Administrator',
    user: 'User',

    // User status
    pending: 'Pending',
    active: 'Active',
    suspended: 'Suspended',
    rejected: 'Rejected',
    deleted: 'Deleted',

    // Ticket status
    new: 'New',
    inProgress: 'In Progress',
    onHold: 'On Hold',
    resolved: 'Resolved',
    closed: 'Closed',

    // Ticket priority
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',

    // Settings
    profile: 'Profile',
    theme: 'Theme',
    preferences: 'Preferences',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    language: 'Language',
    notifications: 'Notifications',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    accentColor: 'Accent color',
    density: 'Display density',
    comfortable: 'Comfortable',
    compact: 'Compact',
    animations: 'Animations',

    // User management
    userManagement: 'User management',
    assignRoles: 'Assign roles and manage access',
    approve: 'Approve',
    reject: 'Reject',
    suspend: 'Suspend',
    reactivate: 'Reactivate',
    pendingUsers: 'Pending',
    rejectedUsers: 'Rejected',
    suspendedUsers: 'Suspended',
    noUsers: 'No users',
    noPendingUsers: 'No pending users',
    noRejectedUsers: 'No rejected users',
    noSuspendedUsers: 'No suspended users',

    // Actions confirmations
    approveUserTitle: 'Approve user',
    approveUserMessage: 'Do you want to approve',
    approveUserDetail: 'The user will be able to access the platform and create tickets.',
    rejectUserTitle: 'Reject user',
    rejectUserMessage: 'Do you want to reject',
    rejectUserDetail: 'The user will receive a rejection message but can retry joining the organization.',
    suspendUserTitle: 'Suspend user',
    suspendUserMessage: 'Do you want to suspend',
    suspendUserDetail: 'The user will no longer be able to log in or access the platform.',
    reactivateUserTitle: 'Reactivate user',
    reactivateUserMessage: 'Do you want to reactivate',
    reactivateUserDetail: 'The user will be able to log in and access the platform again.',
    changeRoleTitle: 'Change role',
    changeRoleMessage: 'Change the role of',
    changeRoleAdminDetail: 'The user will have access to all administration features.',
    changeRoleUserDetail: 'The user will lose their administration rights.',
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('resolv-language') as Language | null;
    if (stored === 'fr' || stored === 'en') {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('resolv-language', language);
    // Also set html lang attribute
    document.documentElement.lang = language;
  }, [language, mounted]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = translations[language];

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
