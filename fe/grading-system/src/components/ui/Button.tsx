"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type ButtonVariant = "primary" | "dark" | "light" | "pill" | "overlay" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      href,
      fullWidth,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles shared across all button variants
    const base =
      "inline-flex items-center justify-center gap-2 font-[600] cursor-pointer transition-all duration-200 ease border";

    // Variant-specific styles (inline approach for consistency with inline navbar styles)
    const variantMap: Record<ButtonVariant, string> = {
      primary:
        "bg-[#ff4f00] text-[#fffefb] border-[#ff4f00] hover:bg-[#e64600] hover:border-[#e64600]",
      dark: "bg-[#201515] text-[#fffefb] border-[#201515] hover:bg-[#c5c0b1] hover:text-[#201515] hover:border-[#c5c0b1]",
      light: "bg-[#eceae3] text-[#36342e] border-[#c5c0b1] hover:bg-[#c5c0b1] hover:text-[#201515]",
      pill: "bg-[#fffefb] text-[#36342e] border-[#c5c0b1] hover:bg-[#eceae3] rounded-[20px]",
      overlay: "bg-[rgba(45,45,46,0.5)] text-[#fffefb] border-transparent hover:bg-[#2d2d2e] rounded-[20px] backdrop-blur-sm",
      outline: "bg-transparent text-[#201515] border-[#c5c0b1] hover:bg-[#eceae3] hover:border-[#c5c0b1]",
    };

    const sizeMap: Record<ButtonSize, string> = {
      sm: "px-3 py-[6px] text-[0.875rem] rounded-[4px]",
      md: "px-4 py-[8px] text-[1rem] rounded-[4px]",
      lg: "px-6 py-5 text-[1rem] rounded-[8px]",
    };

    const classes = cn(
      base,
      variantMap[variant],
      sizeMap[size],
      fullWidth && "w-full",
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };