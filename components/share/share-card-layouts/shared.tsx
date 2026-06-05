/* eslint-disable @next/next/no-img-element -- Share card PNG export needs browser-native img elements. */

import type { ReactNode } from "react";

export type ShareCardLayout =
  | "poster"
  | "quote"
  | "ticket-one"
  | "ticket-two"
  | "ticket-three";

export const shareCardLayoutOptions: Array<{
  id: ShareCardLayout;
  label: string;
}> = [
  { id: "poster", label: "포스터형" },
  { id: "quote", label: "문장형" },
  { id: "ticket-one", label: "티켓 1" },
  { id: "ticket-two", label: "티켓 2" },
  { id: "ticket-three", label: "티켓 3" },
];

export type ShareCardEmotion = {
  id: string;
  name: string;
  emoji: string | null;
};

export type ShareCardLayoutProps = {
  movieTitle: string;
  releaseYear: string | null;
  posterUrl: string | null;
  emotions: ShareCardEmotion[];
  quote: string;
  rating: number | null;
  watchedDate: string | null;
  watchMethodLabel: string | null;
  authorName: string;
};

type EmotionChipsProps = {
  emotions: ShareCardEmotion[];
  className?: string;
  density?: "default" | "compact";
};

type PosterBackdropProps = {
  posterUrl: string | null;
  children?: ReactNode;
  className?: string;
  overlay?: string;
};

type PosterImageLayerProps = {
  posterUrl: string | null;
  className?: string;
  overlay?: string;
};

type ShareCardFooterProps = {
  authorName: string;
  className?: string;
};

type ShareCardMetaProps = {
  rating: number | null;
  watchedDate: string | null;
  watchMethodLabel: string | null;
  className?: string;
};

const emotionChipBaseClassName =
  "inline-flex w-fit max-w-full shrink-0 items-center whitespace-nowrap rounded-full border font-semibold leading-none [word-break:keep-all]";

const emotionChipDensityClassNames = {
  default: "px-2.5 py-1.5 text-[11px]",
  compact: "px-2 py-1 text-[10px]",
};

const emotionChipClassNames: Record<string, string> = {
  따뜻함: "border-[#f0a15f]/42 bg-[#3a2416] text-[#ffd3a3]",
  설렘: "border-[#f4a3b8]/42 bg-[#351924] text-[#ffd6df]",
  슬픔: "border-[#c8a7c8]/38 bg-[#261c28] text-[#ead2e6]",
  먹먹함: "border-[#b99678]/40 bg-[#2b211a] text-[#ead6c2]",
  위로됨: "border-[#a9a8df]/40 bg-[#202038] text-[#d9dcff]",
  찝찝함: "border-[#8f8ba7]/40 bg-[#1f1f2b] text-[#d8d2e8]",
  통쾌함: "border-[#d98b56]/45 bg-[#351c11] text-[#ffc19a]",
  "여운 남음": "border-[#c59a4b]/45 bg-[#312515] text-[#ffd98c]",
  혼란스러움: "border-[#98a0ba]/40 bg-[#202432] text-[#dde4f2]",
  압도됨: "border-[#b685ba]/42 bg-[#2d1a2f] text-[#efcff0]",
  웃김: "border-[#e1b35d]/45 bg-[#3a2a13] text-[#ffe0a3]",
  무서움: "border-[#8d75a8]/42 bg-[#18151f] text-[#d8c7f0]",
};

export function getEmotionLabel(emotion: ShareCardEmotion) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

export function getPreviewText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export function getEmotionChipClassName(
  emotionName: string,
  density: EmotionChipsProps["density"] = "default",
) {
  return [
    emotionChipBaseClassName,
    emotionChipDensityClassNames[density],
    emotionChipClassNames[emotionName] ??
      "border-[#ffd3a3]/32 bg-[#2a1d15] text-[#fff7ea]",
  ].join(" ");
}

export function EmotionChips({
  emotions,
  className = "",
  density = "default",
}: EmotionChipsProps) {
  if (emotions.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {emotions.map((emotion) => (
        <span
          key={emotion.id}
          className={getEmotionChipClassName(emotion.name, density)}
        >
          {getEmotionLabel(emotion)}
        </span>
      ))}
    </div>
  );
}

export function PosterBackdrop({
  posterUrl,
  children,
  className = "",
  overlay = "linear-gradient(180deg,rgba(18,16,15,0.06),rgba(18,16,15,0.78))",
}: PosterBackdropProps) {
  return (
    <div
      className={`relative overflow-hidden bg-[linear-gradient(145deg,rgba(240,161,95,0.22),rgba(244,199,216,0.12)_46%,rgba(18,16,15,0.82))] ${className}`}
    >
      <PosterImageLayer posterUrl={posterUrl} overlay={overlay} />
      {children}
    </div>
  );
}

export function PosterImageLayer({
  posterUrl,
  className = "",
  overlay,
}: PosterImageLayerProps) {
  if (!posterUrl) {
    return null;
  }

  const crossOrigin = posterUrl.startsWith("/") ? "anonymous" : undefined;

  return (
    <>
      <img
        alt=""
        aria-hidden="true"
        crossOrigin={crossOrigin}
        src={posterUrl}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
      {overlay ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: overlay }}
        />
      ) : null}
    </>
  );
}

export function ShareCardMeta({
  rating,
  watchedDate,
  watchMethodLabel,
  className = "",
}: ShareCardMetaProps) {
  const items = [
    rating ? `별점 ${rating}` : null,
    watchedDate,
    watchMethodLabel,
  ].filter((item): item is string => Boolean(item));

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 text-xs text-[#c9ad96] ${className}`}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export function ShareCardFooter({
  authorName,
  className = "",
}: ShareCardFooterProps) {
  return (
    <div
      className={`flex items-end justify-between gap-3 border-t border-[#fff7ea]/10 pt-4 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-xs text-[#c9ad96]">기록한 사람</p>
        <p className="mt-1 truncate text-sm font-semibold text-[#fff7ea]">
          {authorName}
        </p>
      </div>
      <p className="shrink-0 whitespace-nowrap text-right text-[10px] leading-none text-[#f2b482]">
        영화가 남긴 마음을 기록하는 곳
      </p>
    </div>
  );
}
