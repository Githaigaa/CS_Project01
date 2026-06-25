import { cn } from "../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm": variant === "primary",
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm": variant === "secondary",
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm": variant === "accent",
          "border-2 border-border bg-transparent hover:bg-muted": variant === "outline",
          "hover:bg-muted": variant === "ghost",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "danger",
        },
        {
          "px-3 py-1.5 gap-1.5": size === "sm",
          "px-4 py-2 gap-2": size === "md",
          "px-6 py-3 gap-2": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
