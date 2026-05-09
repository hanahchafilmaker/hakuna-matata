import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "h-14 w-full min-w-0 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-2 text-[15px]",
        "text-foreground outline-none transition-[border-color,background-color,box-shadow]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-white/16 focus-visible:bg-white/[0.06] focus-visible:ring-0",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "dark:bg-white/[0.04] dark:focus-visible:bg-white/[0.06]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
