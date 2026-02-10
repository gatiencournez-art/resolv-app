'use client';

import { useState, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface MultiSelectOption {
  value: string;
  label: string;
  dot?: string;         // Tailwind class for colored dot
  icon?: React.ReactNode;
  avatar?: string;      // Initials for avatar display
}

interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  label?: string;
  allLabel?: string;    // Text shown when nothing selected (e.g. "Tous les statuts")
}

// ============================================================================
// MULTI SELECT
// ============================================================================

export function MultiSelect({
  values,
  onChange,
  options,
  placeholder = 'Filtrer...',
  label,
  allLabel,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen]);

  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  // Selected options for display
  const selectedOptions = options.filter((o) => values.includes(o.value));
  const displayLabel = allLabel || placeholder;

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-[10px] font-semibold text-foreground-muted/70 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-[34px] px-3 text-[13px] text-left flex items-center gap-1.5
          rounded-xl border transition-all duration-[180ms]
          bg-surface dark:bg-white/[0.03]
          border-th-border dark:border-white/[0.1]
          text-foreground
          hover:border-th-border-secondary dark:hover:border-white/[0.18]
          focus:outline-none focus:ring-2 focus:ring-accent/30
          ${isOpen ? 'ring-2 ring-accent/30 border-accent/40 dark:border-accent/40' : ''}
          ${selectedOptions.length > 0 ? 'border-accent/30 dark:border-accent/30' : ''}
        `}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-foreground-muted truncate">{displayLabel}</span>
        ) : selectedOptions.length === 1 ? (
          /* Single selection: show the item inline */
          <span className="flex items-center gap-1.5 min-w-0 truncate">
            {selectedOptions[0].dot && (
              <span className={`w-1.5 h-1.5 rounded-full ${selectedOptions[0].dot} flex-shrink-0`} />
            )}
            <span className="text-foreground truncate">{selectedOptions[0].label}</span>
          </span>
        ) : (
          /* Multiple selections: compact summary */
          <span className="flex items-center gap-1.5 min-w-0">
            {/* Show dots for all selected items */}
            <span className="flex items-center -space-x-0.5 flex-shrink-0">
              {selectedOptions.slice(0, 4).map((opt) => (
                <span
                  key={opt.value}
                  className={`w-2 h-2 rounded-full ${opt.dot || 'bg-accent'} ring-1 ring-surface dark:ring-[#0d0d14]`}
                />
              ))}
            </span>
            <span className="text-foreground font-medium tabular-nums truncate">
              {selectedOptions.length}
            </span>
            <span className="text-foreground-muted truncate">sél.</span>
          </span>
        )}

        {/* Clear button or chevron */}
        <span className="ml-auto flex items-center gap-1 flex-shrink-0 pl-1">
          {selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-0.5 rounded hover:bg-surface-hover dark:hover:bg-white/[0.08] transition-colors"
            >
              <svg className="w-3 h-3 text-foreground-muted/60 hover:text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-3.5 h-3.5 text-foreground-muted/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute z-50 mt-1.5 w-full min-w-[200px]
            rounded-2xl overflow-hidden
            bg-surface dark:bg-[#1a1a2e]
            backdrop-blur-xl
            border border-th-border dark:border-white/[0.1]
            shadow-dropdown dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
            animate-slide-up-sm
            max-h-64 overflow-y-auto
          "
        >
          {/* Header with clear */}
          {values.length > 0 && (
            <div className="px-3.5 py-2.5 border-b border-th-border/60 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-foreground-muted font-medium">
                {values.length} sélectionné{values.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-[11px] text-accent hover:text-accent-hover transition-colors font-semibold"
              >
                Effacer tout
              </button>
            </div>
          )}

          {/* Options */}
          <div className="p-1.5">
            {options.map((option) => {
              const isSelected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={`
                    w-full px-3 py-2 text-[13px] text-left flex items-center gap-2.5
                    rounded-xl transition-all duration-[120ms]
                    ${isSelected
                      ? 'bg-accent/[0.08]'
                      : 'hover:bg-surface-hover dark:hover:bg-white/[0.06]'
                    }
                    text-foreground
                  `}
                >
                  {/* Checkbox */}
                  <span
                    className={`
                      w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center border transition-all duration-[120ms]
                      ${isSelected
                        ? 'bg-accent border-accent shadow-sm'
                        : 'border-foreground-muted/30 dark:border-white/[0.15] bg-transparent'
                      }
                    `}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>

                  {option.dot && <span className={`w-2 h-2 rounded-full ${option.dot} flex-shrink-0`} />}
                  {option.avatar && (
                    <span className="w-6 h-6 rounded-full bg-surface-tertiary dark:bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-foreground-secondary flex-shrink-0 border border-th-border/40 dark:border-white/[0.1]">
                      {option.avatar}
                    </span>
                  )}
                  {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                  <span className="flex-1 truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
