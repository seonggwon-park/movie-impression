import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./class-names";

type EmotionTagTone = "warm" | "rose" | "violet";

const emotionTagTones: Record<EmotionTagTone, string> = {
  warm: "border-[#f0a15f]/35 bg-[#f0a15f]/12 text-[#ffd3a3]",
  rose: "border-[#f4c7d8]/35 bg-[#f4c7d8]/10 text-[#f4c7d8]",
  violet: "border-[#c8b6ff]/35 bg-[#c8b6ff]/10 text-[#d8ccff]",
};

type EmotionTagProps = ComponentPropsWithoutRef<"button"> & {
  selected?: boolean;
  tone?: EmotionTagTone;
};

export function EmotionTag({
  className,
  selected = false,
  tone = "warm",
  type = "button",
  ...props
}: EmotionTagProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]",
        emotionTagTones[tone],
        selected && "border-[#ffd3a3] bg-[#ffd3a3] text-[#1b120d]",
        className,
      )}
      {...props}
    />
  );
}
