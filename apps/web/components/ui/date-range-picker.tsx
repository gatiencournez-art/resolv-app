'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

function formatYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

interface DateRangePickerProps {
  from: string;
  to: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onApply: () => void;
}

export function DateRangePicker({ from, to, onChangeFrom, onChangeTo, onApply }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const [selecting, setSelecting] = useState<'start' | 'end'>(from ? 'end' : 'start');
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const today = new Date();
  const todayStr = formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
  const initial = from ? new Date(from) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => { setPortalReady(true); }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const calW = 320;
    let left = rect.left;
    if (left + calW > window.innerWidth - 8) {
      left = window.innerWidth - calW - 8;
    }
    setPos({ top: rect.bottom + 6, left });
  }, []);

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
      window.addEventListener('resize', updatePosition);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (from) {
      const d = new Date(from);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [from]);

  useEffect(() => {
    if (isOpen) {
      if (from && to) setSelecting('start');
      else if (from) setSelecting('end');
      else setSelecting('start');
    }
  }, [isOpen, from, to]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
  const trailingDays = Array.from({ length: firstDay }, (_, i) => ({
    day: prevMonthDays - firstDay + 1 + i, current: false,
  }));
  const currentDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1, current: true,
  }));
  const totalCells = trailingDays.length + currentDays.length;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const leadingDays = Array.from({ length: remaining }, (_, i) => ({
    day: i + 1, current: false,
  }));
  const allDays = [...trailingDays, ...currentDays, ...leadingDays];

  function prevMonthNav() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonthNav() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function handleDayClick(dayStr: string) {
    if (selecting === 'start') {
      onChangeFrom(dayStr);
      onChangeTo('');
      setSelecting('end');
    } else {
      if (dayStr < from) {
        onChangeFrom(dayStr);
        onChangeTo(from);
      } else {
        onChangeTo(dayStr);
      }
      setSelecting('start');
    }
  }

  function handleApply() {
    if (from && to) {
      onApply();
      setIsOpen(false);
    }
  }

  function clear() {
    onChangeFrom('');
    onChangeTo('');
    setSelecting('start');
  }

  function getDayState(dayStr: string): 'start' | 'end' | 'in-range' | 'hover-range' | 'none' {
    if (!dayStr) return 'none';
    if (dayStr === from && dayStr === to) return 'start';
    if (dayStr === from) return 'start';
    if (dayStr === to) return 'end';
    if (from && to && dayStr > from && dayStr < to) return 'in-range';
    if (selecting === 'end' && from && hoverDate && !to) {
      const rangeEnd = hoverDate >= from ? hoverDate : from;
      const rangeStart = hoverDate >= from ? from : hoverDate;
      if (dayStr > rangeStart && dayStr < rangeEnd) return 'hover-range';
    }
    return 'none';
  }

  const displayLabel = from && to
    ? `${formatDisplay(from)} → ${formatDisplay(to)}`
    : from
      ? `${formatDisplay(from)} → ...`
      : 'Choisir les dates';

  const calendar = isOpen && portalReady ? createPortal(
    <div
      ref={calendarRef}
      className="fixed z-[200] w-[320px] rounded-2xl bg-surface border border-th-border shadow-2xl"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button type="button" onClick={prevMonthNav}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonthNav}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Instruction */}
      <div className="px-4 pb-2">
        <p className="text-[10px] text-foreground-muted text-center">
          {selecting === 'start' ? 'Sélectionnez la date de début' : 'Sélectionnez la date de fin'}
        </p>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 px-3 pb-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-foreground-muted uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {allDays.map((item, i) => {
          const dayStr = item.current ? formatYMD(viewYear, viewMonth, item.day) : '';
          const state = item.current ? getDayState(dayStr) : 'none';
          const isToday = item.current && dayStr === todayStr;
          const isStart = state === 'start';
          const isEnd = state === 'end';
          const isInRange = state === 'in-range';
          const isHoverRange = state === 'hover-range';
          const isEndpoint = isStart || isEnd;

          let bgClass = '';
          if (isInRange || isHoverRange) bgClass = 'bg-accent/8';
          else if (isStart && to) bgClass = 'bg-accent/8 rounded-l-lg';
          else if (isEnd) bgClass = 'bg-accent/8 rounded-r-lg';

          return (
            <div key={i} className={`relative flex items-center justify-center ${bgClass}`}>
              <button
                type="button"
                disabled={!item.current}
                onClick={() => item.current && handleDayClick(dayStr)}
                onMouseEnter={() => item.current && setHoverDate(dayStr)}
                onMouseLeave={() => setHoverDate(null)}
                className={`
                  w-9 h-9 rounded-lg text-xs font-medium flex items-center justify-center transition-all relative z-10
                  ${!item.current
                    ? 'text-foreground-muted/20 cursor-default'
                    : isEndpoint
                      ? 'bg-accent text-white shadow-sm'
                      : isToday && !isInRange && !isHoverRange
                        ? 'text-accent font-semibold hover:bg-accent/20'
                        : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground cursor-pointer'
                  }
                `}
              >
                {item.day}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected range display */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-tertiary/60">
          <div className="flex-1 text-center">
            <span className="text-[10px] text-foreground-muted block mb-0.5">Début</span>
            <span className={`text-xs font-medium ${from ? 'text-foreground' : 'text-foreground-muted'}`}>
              {from ? formatDisplay(from) : '—'}
            </span>
          </div>
          <svg className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-foreground-muted block mb-0.5">Fin</span>
            <span className={`text-xs font-medium ${to ? 'text-foreground' : 'text-foreground-muted'}`}>
              {to ? formatDisplay(to) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button type="button" onClick={clear}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-all">
          Effacer
        </button>
        <button type="button" onClick={handleApply} disabled={!from || !to}
          className="flex-1 px-3 py-2 rounded-xl bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          Appliquer
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-tertiary/50 text-sm text-left transition-all hover:bg-surface-tertiary focus:outline-none"
      >
        <svg className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className={`text-xs ${from ? 'text-foreground' : 'text-foreground-muted'}`}>
          {displayLabel}
        </span>
      </button>
      {calendar}
    </>
  );
}
