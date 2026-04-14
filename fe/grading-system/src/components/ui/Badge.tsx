"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles: Record<BadgeVariant, string> = {
      default: "bg-[#eceae3] text-[#36342e] border border-[#c5c0b1]",
      accent: "bg-[#ff4f00] text-[#fffefb] border border-[#ff4f00]",
      success: "bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]",
      warning: "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]",
      danger: "bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]",
      outline: "bg-transparent text-[#36342e] border border-[#c5c0b1]",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          "px-[8px] py-[4px]",
          "text-[0.75rem] font-semibold leading-none",
          "rounded-[3px]",
          "uppercase tracking-wide",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
