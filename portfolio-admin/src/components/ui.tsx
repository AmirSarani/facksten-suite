import type { ReactNode } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "ghost" | "danger" | "outline";

function buttonClass(variant: ButtonVariant, className?: string) {
  const styles = {
    primary: "bg-cta shadow-neon-sm",
    ghost: "bg-transparent text-on-surface hover:bg-surface-container",
    danger: "bg-error text-white hover:opacity-90",
    outline:
      "border border-outline bg-surface-container-lowest text-on-surface hover:border-cta hover:text-cta",
  }[variant];

  return cx(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 py-2 font-mono text-xs tracking-wide uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-cta cyber-chamfer-sm",
    styles,
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  to,
  variant = "primary",
  className,
  children,
}: {
  to: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function FieldLabel({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
      <span className="text-on-surface">{children}</span>
      {hint ? <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{hint}</span> : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; hint?: string };

export function TextInput({ label, hint, id, className, ...props }: InputProps) {
  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={id} hint={hint}>
          {label}
        </FieldLabel>
      ) : null}
      <input
        id={id}
        className={cx(
          "min-h-11 w-full border border-outline bg-surface-container-low px-3 py-2.5 text-base text-on-surface placeholder:text-on-surface-variant/60 focus-cta",
          className,
        )}
        {...props}
      />
    </div>
  );
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode; hint?: string };

export function TextArea({ label, hint, id, className, ...props }: AreaProps) {
  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={id} hint={hint}>
          {label}
        </FieldLabel>
      ) : null}
      <textarea
        id={id}
        className={cx(
          "min-h-28 w-full resize-y border border-outline bg-surface-container-low px-3 py-2.5 text-base text-on-surface placeholder:text-on-surface-variant/60 focus-cta",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "info";
  children: ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-error/40 bg-error-container text-error"
      : "border-accent-tertiary/35 bg-accent-tertiary/10 text-accent-tertiary";
  return <div className={cx("border px-3 py-2 font-mono text-xs", styles)}>{children}</div>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel-card px-6 py-12 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cta">empty</p>
      <h2 className="mt-2 text-lg text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">{body}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={cx(
        "inline-flex border px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase",
        published
          ? "border-published/40 text-published"
          : "border-outline-variant text-on-surface-variant",
      )}
    >
      {status}
    </span>
  );
}

export function PageHeader({
  title,
  titleFa,
  actions,
}: {
  title: string;
  titleFa: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cta">{titleFa}</p>
        <h1 className="font-brand text-2xl text-on-surface">{title}</h1>
      </div>
      {actions}
    </div>
  );
}

export function StatusToggle({
  value,
  onChange,
}: {
  value: "DRAFT" | "PUBLISHED";
  onChange: (next: "DRAFT" | "PUBLISHED") => void;
}) {
  return (
    <div>
      <FieldLabel hint="status">وضعیت / Status</FieldLabel>
      <div className="inline-flex border border-outline">
        {(["DRAFT", "PUBLISHED"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cx(
              "min-h-11 cursor-pointer px-4 py-2 font-mono text-[11px] tracking-wider uppercase focus-cta",
              value === option
                ? option === "PUBLISHED"
                  ? "bg-cta text-on-primary"
                  : "bg-surface-container text-on-surface"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
