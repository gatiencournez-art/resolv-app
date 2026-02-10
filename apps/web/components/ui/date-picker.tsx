'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// HELPERS
// ============================================================================

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============================================================================
// DATE PICKER
// ============================================================================

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
}

export function DatePicker({ value, onChange, label, placeholder = 'Sélectionner', minDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Position the calendar relative to the button
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        calendarRef.current && !calendarRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
  const trailingDays = Array.from({ length: firstDay }, (_, i) => ({
    day: prevMonthDays - firstDay + 1 + i,
    current: false,
  }));

  const currentDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    current: true,
  }));

  const totalCells = trailingDays.length + currentDays.length;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const leadingDays = Array.from({ length: remaining }, (_, i) => ({
    day: i + 1,
    current: false,
  }));

  const allDays = [...trailingDays, ...currentDays, ...leadingDays];

  const selectedStr = value || '';
  const todayStr = formatYMD(today.getFullYear(), today.getMonth(), today.getDate());

  function isDayDisabled(dayStr: string): boolean {
    if (!minDate) return false;
    return dayStr < minDate;
  }

  function prevMonthNav() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonthNav() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function selectDay(day: number) {
    const str = formatYMD(viewYear, viewMonth, day);
    if (isDayDisabled(str)) return;
    onChange(str);
    setIsOpen(false);
  }

  function selectToday() {
    if (isDayDisabled(todayStr)) return;
    onChange(todayStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  }

  function clear() {
    onChange('');
    setIsOpen(false);
  }

  const calendar = isOpen && portalReady ? createPortal(
    <div
      ref={calendarRef}
      className="fixed z-[200] w-[280px] rounded-2xl bg-surface border border-th-border shadow-2xl"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Month/Year header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={prevMonthNav}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonthNav}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 px-3 pb-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-foreground-muted uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
        {allDays.map((item, i) => {
          const dayStr = item.current ? formatYMD(viewYear, viewMonth, item.day) : '';
          const isSelected = item.current && dayStr === selectedStr;
          const isToday = item.current && dayStr === todayStr;
          const disabled = !item.current || isDayDisabled(dayStr);

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => item.current && selectDay(item.day)}
              className={`
                w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all
                ${disabled
                  ? 'text-foreground-muted/20 cursor-default'
                  : isSelected
                    ? 'bg-accent text-white shadow-sm'
                    : isToday
                      ? 'bg-accent/15 text-accent font-semibold hover:bg-accent/25'
                      : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground cursor-pointer'
                }
              `}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          type="button"
          onClick={clear}
          className="text-xs text-foreground-muted hover:text-foreground transition-colors"
        >
          Effacer
        </button>
        <button
          type="button"
          onClick={selectToday}
          disabled={isDayDisabled(todayStr)}
          className="text-xs text-accent hover:text-accent-hover font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Aujourd&apos;hui
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      {label && (
        <label className="text-[10px] text-foreground-muted mb-1.5 block">{label}</label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-tertiary/60 border border-th-border/40 text-sm text-left transition-all hover:border-th-border/70 focus:outline-none focus:ring-1 focus:ring-accent/40"
      >
        <svg className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className={value ? 'text-foreground text-xs' : 'text-foreground-muted text-xs'}>
          {value ? formatForDisplay(value) : placeholder}
        </span>
      </button>
      {calendar}
    </div>
  );
}
