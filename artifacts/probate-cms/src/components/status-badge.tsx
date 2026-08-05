import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;

  const s = status.toLowerCase();
  
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let colorClass = "";

  if (s === "active" || s === "paid") {
    colorClass = "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    variant = "secondary";
  } else if (s === "pending") {
    colorClass = "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    variant = "secondary";
  } else if (s === "closed" || s === "waived") {
    colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    variant = "secondary";
  } else if (s === "overdue") {
    colorClass = "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    variant = "destructive";
  }

  return (
    <Badge variant={variant} className={cn("rounded-sm px-2 font-medium capitalize", colorClass, className)}>
      {status}
    </Badge>
  );
}
