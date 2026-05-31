import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./class-names";

type EmotionTagTone = "warm" | "rose" | "violet";

const emotionTagTones: Record<EmotionTagTone, string> = {
  warm:
    "border-[#f0a15f]/35 bg-[#f0a15f]/12 text-[#ffd3a3] hover:border-[#f0a15f]/55 hover:bg-[#f0a15f]/20",
  rose:
    "border-[#f4c7d8]/35 bg-[#f4c7d8]/10 text-[#f4c7d8] hover:border-[#f4c7d8]/55 hover:bg-[#f4c7d8]/18",
  violet:
    "border-[#c8b6ff]/35 bg-[#c8b6ff]/10 text-[#d8ccff] hover:border-[#c8b6ff]/55 hover:bg-[#c8b6ff]/18",
};

const selectedEmotionTagClassName =
  "border-[#f0a15f] bg-[#ffd3a3] font-semibold text-[#1f1208] shadow-[0_10px_28px_rgba(240,161,95,0.18)] hover:border-[#ffc083] hover:bg-[#ffc083] hover:text-[#1f1208]";

type EmotionTagBaseProps = {
  className?: string;
  selected?: boolean;
  tone?: EmotionTagTone;
};

type EmotionTagButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  keyof EmotionTagBaseProps
> &
  EmotionTagBaseProps & {
    as?: "button";
  };

type EmotionTagSpanProps = Omit<
  ComponentPropsWithoutRef<"span">,
  keyof EmotionTagBaseProps
> &
  EmotionTagBaseProps & {
    as: "span";
  };

type EmotionTagProps = EmotionTagButtonProps | EmotionTagSpanProps;

export function EmotionTag({
  as = "button",
  className,
  selected = false,
  tone = "warm",
  ...props
}: EmotionTagProps) {
  const tagClassName = cn(
    "inline-flex min-h-9 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]",
    selected ? selectedEmotionTagClassName : emotionTagTones[tone],
    className,
  );

  if (as === "span") {
    return (
      <span
        className={tagClassName}
        {...(props as ComponentPropsWithoutRef<"span">)}
      />
    );
  }

  const { type = "button", ...buttonProps } =
    props as ComponentPropsWithoutRef<"button">;

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={tagClassName}
      {...buttonProps}
    />
  );
}
