/**
 * Design tokens for premium SaaS UI consistency.
 * These are reference values — Tailwind classes are the primary usage.
 * Import these when you need programmatic access to design values.
 */

export const radius = {
  card: '16px',     // rounded-2xl — cards, panels, modals
  panel: '14px',    // rounded-[14px] — nested panels, sections
  input: '12px',    // rounded-xl — inputs, selects, buttons
  button: '12px',   // rounded-xl — buttons, action items
  badge: '999px',   // rounded-full — pills, badges, chips
  item: '12px',     // rounded-xl — list items, menu items
} as const;

export const shadow = {
  soft: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
  card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 2px 8px -2px rgba(0,0,0,0.04)',
  elevated: '0 4px 16px -4px rgba(0,0,0,0.08), 0 2px 8px -4px rgba(0,0,0,0.04)',
  glow: '0 0 20px -5px var(--accent)',
  dropdown: '0 12px 40px -8px rgba(0,0,0,0.25), 0 4px 12px -4px rgba(0,0,0,0.1)',
} as const;

export const timing = {
  fast: '120ms',    // Micro-interactions, hover, focus
  normal: '180ms',  // Dropdowns, popovers, state changes
  slow: '300ms',    // Page transitions, large elements
} as const;

export const glass = {
  bg: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  bgSubtle: 'rgba(255,255,255,0.02)',
  borderSubtle: 'rgba(255,255,255,0.05)',
} as const;
