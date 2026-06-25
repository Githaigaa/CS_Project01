import { cn } from "../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1.5 text-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-3 py-2 bg-input-background border border-input rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-ring transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-destructive">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: {
  label?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1.5 text-foreground">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-3 py-2 bg-input-background border border-input rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-ring transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed min-h-[100px]",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-destructive">{error}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  className,
  children,
  ...props
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1.5 text-foreground">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full px-3 py-2 bg-input-background border border-input rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-ring transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-destructive">{error}</p>
      )}
    </div>
  );
}
