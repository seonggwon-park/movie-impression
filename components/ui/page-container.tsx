import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./class-names";

type PageContainerProps = ComponentPropsWithoutRef<"section">;

export function PageContainer({
  className,
  ...props
}: PageContainerProps) {
  return (
    <section
      className={cn("mx-auto w-full px-6 sm:px-10 lg:px-20", className)}
      {...props}
    />
  );
}
