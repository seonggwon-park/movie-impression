import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./class-names";

type ButtonVariant = "primary" | "secondary";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#f0a15f] text-[#1b120d] shadow-[0_18px_48px_rgba(240,161,95,0.22)] hover:bg-[#ffc083] focus:ring-[#ffd3a3]",
  secondary:
    "border border-[#fff7ea]/24 bg-[#fff7ea]/8 text-[#fff7ea] backdrop-blur hover:border-[#fff7ea]/42 hover:bg-[#fff7ea]/14 focus:ring-[#f4c7d8]",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#12100f]",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
