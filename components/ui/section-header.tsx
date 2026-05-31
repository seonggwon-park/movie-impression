import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./class-names";

type HeadingTag = "h1" | "h2" | "h3";
type SectionHeaderVariant = "section" | "hero";

const sectionHeaderVariants: Record<
  SectionHeaderVariant,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  section: {
    eyebrow: "mb-4 text-sm font-medium text-[#f2b482]",
    title:
      "max-w-2xl text-3xl font-semibold leading-[1.2] text-[#fff7ea] sm:text-4xl",
    description: "mt-4 max-w-xl text-lg leading-8 text-[#e7d4c0]",
  },
  hero: {
    eyebrow: "mb-7 text-sm font-medium text-[#f2b482]",
    title:
      "max-w-3xl text-4xl font-semibold leading-[1.18] text-[#fff7ea] sm:text-5xl lg:text-6xl",
    description: "mt-6 max-w-xl text-lg leading-8 text-[#e7d4c0] sm:text-xl",
  },
};

type SectionHeaderProps = ComponentPropsWithoutRef<"div"> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  titleAs?: HeadingTag;
  variant?: SectionHeaderVariant;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionHeader({
  className,
  description,
  descriptionClassName,
  eyebrow,
  eyebrowClassName,
  title,
  titleAs: Title = "h2",
  titleClassName,
  variant = "section",
  ...props
}: SectionHeaderProps) {
  const styles = sectionHeaderVariants[variant];

  return (
    <div className={className} {...props}>
      {eyebrow ? (
        <p className={cn(styles.eyebrow, eyebrowClassName)}>
          {eyebrow}
        </p>
      ) : null}
      <Title className={cn(styles.title, titleClassName)}>
        {title}
      </Title>
      {description ? (
        <p className={cn(styles.description, descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
