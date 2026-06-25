import { cn } from "../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": variant === "success",
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200": variant === "warning",
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200": variant === "danger",
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200": variant === "info",
          "bg-muted text-muted-foreground": variant === "secondary",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
