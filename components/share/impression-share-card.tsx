import { forwardRef } from "react";

type ShareCardEmotion = {
  id: string;
  name: string;
  emoji: string | null;
};

type ImpressionShareCardProps = {
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

function getEmotionLabel(emotion: ShareCardEmotion) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

function getPreviewText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

const baseEmotionChipClassName =
  "inline-flex w-fit max-w-full shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold leading-none [word-break:keep-all]";

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

function getEmotionChipClassName(emotionName: string) {
  return `${baseEmotionChipClassName} ${
    emotionChipClassNames[emotionName] ??
    "border-[#ffd3a3]/32 bg-[#2a1d15] text-[#fff7ea]"
  }`;
}

export const ImpressionShareCard = forwardRef<
  HTMLDivElement,
  ImpressionShareCardProps
>(function ImpressionShareCard(
  {
    movieTitle,
    releaseYear,
    posterUrl,
    emotions,
    quote,
    rating,
    watchedDate,
    watchMethodLabel,
    authorName,
  },
  ref,
) {
  const displayQuote = getPreviewText(quote, 110);

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-lg border border-[#fff7ea]/14 bg-[#0d0a09] text-[#fff7ea] shadow-[0_34px_110px_rgba(0,0,0,0.5)]"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 top-[52%] z-20 border-t border-dashed border-[#ffd3a3]/24"
      />
      <span
        aria-hidden="true"
        className="absolute -left-4 top-[calc(52%-1rem)] z-30 h-8 w-8 rounded-full border border-[#fff7ea]/12 bg-[#050403]"
      />
      <span
        aria-hidden="true"
        className="absolute -right-4 top-[calc(52%-1rem)] z-30 h-8 w-8 rounded-full border border-[#fff7ea]/12 bg-[#050403]"
      />
      <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(240,161,95,0.24),transparent_36%),linear-gradient(180deg,rgba(18,16,15,0.2),#12100f_58%)]">
        <div
          className="relative min-h-0 flex-[1.08] bg-[linear-gradient(145deg,rgba(240,161,95,0.22),rgba(244,199,216,0.12)_46%,rgba(18,16,15,0.82))] bg-cover bg-center"
          style={
            posterUrl
              ? {
                  backgroundImage: `linear-gradient(180deg,rgba(18,16,15,0.05),rgba(18,16,15,0.78)),url(${posterUrl})`,
                }
              : undefined
          }
        >
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs font-semibold text-[#ffd3a3]">여운</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight">
              {movieTitle}
            </h3>
            {releaseYear ? (
              <p className="mt-2 text-sm text-[#e7d4c0]">{releaseYear}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-[0.92] flex-col justify-between px-6 pb-6 pt-7">
          <div>
            {emotions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {emotions.map((emotion) => (
                  <span
                    key={emotion.id}
                    className={getEmotionChipClassName(emotion.name)}
                  >
                    {getEmotionLabel(emotion)}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="mt-5 text-[22px] font-semibold leading-snug text-[#fff7ea]">
              “{displayQuote}”
            </p>
          </div>

          <div>
            <div className="flex flex-wrap gap-2 text-xs text-[#c9ad96]">
              {rating ? <span>별점 {rating}</span> : null}
              {watchedDate ? <span>{watchedDate}</span> : null}
              {watchMethodLabel ? <span>{watchMethodLabel}</span> : null}
            </div>

            <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#fff7ea]/10 pt-4">
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
          </div>
        </div>
      </div>
    </div>
  );
});
