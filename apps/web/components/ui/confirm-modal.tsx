'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================================================
// ICONS
// ============================================================================

function AlertTriangleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 9v4m0 4h.01"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
      <path
        d="M12 16v-4m0-4h.01"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuestionCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
      <path
        d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// CONFIRM MODAL
// ============================================================================

export function ConfirmModal({
  isOpen,
  title,
  message,
  detail,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onCancel();
    }, 150);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) handleClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKey);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
      iconColor: 'text-rose-500 dark:text-rose-400',
      buttonBg: 'bg-rose-500 hover:bg-rose-600',
      buttonShadow: 'shadow-sm hover:shadow-md hover:shadow-rose-500/10',
      ringColor: 'focus-visible:ring-rose-500/50',
    },
    warning: {
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      iconColor: 'text-amber-500 dark:text-amber-400',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
      buttonShadow: 'shadow-sm hover:shadow-md hover:shadow-amber-500/10',
      ringColor: 'focus-visible:ring-amber-500/50',
    },
    default: {
      iconBg: 'bg-accent/10 dark:bg-accent/15',
      iconColor: 'text-accent',
      buttonBg: 'bg-accent hover:bg-accent-hover',
      buttonShadow: 'shadow-sm hover:shadow-md hover:shadow-accent/10',
      ringColor: 'focus-visible:ring-accent/50',
    },
  };

  const config = variantConfig[variant];

  const Icon = variant === 'danger' ? AlertTriangleIcon :
               variant === 'warning' ? InfoCircleIcon :
               QuestionCircleIcon;

  return (
    <div
      ref={overlayRef}
      className={`
        fixed inset-0 z-[100] flex items-center justify-center p-4
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}
      `}
      onClick={(e) => {
        if (e.target === overlayRef.current && !isLoading) handleClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-[400px]
          ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}
        `}
      >
        <div className="relative rounded-2xl bg-surface border border-th-border shadow-2xl overflow-hidden">
          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className={`
                w-14 h-14 rounded-2xl ${config.iconBg}
                flex items-center justify-center
              `}>
                <span className={config.iconColor}>
                  <Icon />
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
              </h3>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {message}
              </p>
              {detail && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-surface-tertiary border border-th-border/40">
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    {detail}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="
                  flex-1 h-11 rounded-xl text-sm font-medium
                  bg-surface-tertiary hover:bg-surface-hover
                  border border-th-border/60 hover:border-th-border
                  text-foreground-secondary hover:text-foreground
                  transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-border
                "
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={`
                  flex-1 h-11 rounded-xl text-sm font-semibold
                  ${config.buttonBg} ${config.buttonShadow}
                  text-white
                  transition-all duration-150
                  disabled:opacity-70 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 ${config.ringColor}
                  hover:scale-[1.01] active:scale-[0.98]
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>En cours...</span>
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-fade-out {
          animation: fadeOut 0.15s ease-in forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-out {
          animation: scaleOut 0.15s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
