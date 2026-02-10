import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            block w-full px-3 py-2 border rounded-xl bg-surface dark:bg-white/[0.03] text-foreground
            placeholder-foreground-muted transition-all duration-[180ms]
            focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40
            disabled:bg-surface-tertiary disabled:text-foreground-muted disabled:cursor-not-allowed
            ${error ? 'border-[var(--priority-critical)]' : 'border-th-border dark:border-white/[0.1]'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-[var(--priority-critical)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
