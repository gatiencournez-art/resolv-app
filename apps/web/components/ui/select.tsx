'use client';

import { useState, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  dot?: string;       // Tailwind class for colored dot (e.g. 'bg-indigo-400')
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

// ============================================================================
// SELECT (single)
// ============================================================================

export function Select({ value, onChange, options, placeholder = 'Sélectionner...', disabled = false, label }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

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

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-9 px-3 text-[13px] text-left flex items-center gap-2
          rounded-xl border transition-all duration-[180ms]
          bg-surface dark:bg-white/[0.03]
          border-th-border dark:border-white/[0.1]
          text-foreground
          hover:border-th-border-secondary dark:hover:border-white/[0.18]
          focus:outline-none focus:ring-2 focus:ring-accent/30
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-accent/30 border-accent/40 dark:border-accent/40' : ''}
        `}
      >
        {selected?.dot && <span className={`w-2 h-2 rounded-full ${selected.dot} flex-shrink-0`} />}
        {selected?.icon && <span className="flex-shrink-0">{selected.icon}</span>}
        <span className={`flex-1 truncate ${!selected ? 'text-foreground-muted' : ''}`}>
          {selected?.label || placeholder}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute z-50 mt-1.5 w-full
            rounded-2xl overflow-hidden p-1.5
            bg-surface dark:bg-[#1a1a2e]
            backdrop-blur-xl
            border border-th-border dark:border-white/[0.1]
            shadow-dropdown dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
            animate-slide-up-sm
            max-h-60 overflow-y-auto
          "
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-[13px] text-left flex items-center gap-2.5
                  rounded-xl transition-all duration-[120ms]
                  ${isSelected
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground hover:bg-surface-hover dark:hover:bg-white/[0.06]'
                  }
                `}
              >
                {option.dot && <span className={`w-2 h-2 rounded-full ${option.dot} flex-shrink-0`} />}
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
