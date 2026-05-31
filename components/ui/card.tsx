import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./class-names";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#fff7ea]/12 bg-[#fff7ea]/7 p-5 text-[#fff7ea] shadow-[0_20px_70px_rgba(0,0,0,0.22)]",
        className,
      )}
      {...props}
    />
  );
}
