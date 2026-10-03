import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "block w-full rounded-2xl border bg-white px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 transition-colors focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose/40";

type FieldWrapperProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id: string;
  children: React.ReactNode;
  className?: string;
};

function FieldWrapper({ label, error, hint, required, id, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-rose-deeper" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, id, className, wrapperClassName, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} id={fieldId} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldBase, error ? "border-red-400" : "border-rose-light", className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, id, className, wrapperClassName, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} id={fieldId} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldBase, "min-h-[110px] resize-y", error ? "border-red-400" : "border-rose-light", className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, id, className, wrapperClassName, children, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} id={fieldId} className={wrapperClassName}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        className={cn(fieldBase, "appearance-none bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat pr-10", error ? "border-red-400" : "border-rose-light", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A8426A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  error?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, className, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-rose-dark accent-rose-deep"
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1 pl-8 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});

/** Skriveno polje protiv spam botova. Ljudi ga ne vide i ne popunjavaju. */
export const Honeypot = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Honeypot(props, ref) {
    return (
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Vaš sajt (ne popunjavati)
          <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
        </label>
      </div>
    );
  },
);
