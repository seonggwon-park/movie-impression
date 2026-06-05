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
  const visibleEmotions = emotions.slice(0, 3);
  const hiddenEmotionCount = Math.max(
    0,
    emotions.length - visibleEmotions.length,
  );
  const displayQuote = getPreviewText(quote, 110);
  const emotionChipClassName =
    "inline-flex w-fit max-w-full shrink-0 items-center whitespace-nowrap rounded-full border border-[#ffd3a3]/28 bg-[#2a1d15] px-3 py-1.5 text-xs font-semibold leading-none text-[#fff7ea] [word-break:keep-all]";

  return (
    <div
      ref={ref}
      className="mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-lg border border-[#fff7ea]/14 bg-[#12100f] text-[#fff7ea] shadow-[0_34px_110px_rgba(0,0,0,0.5)]"
    >
      <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(240,161,95,0.24),transparent_36%),linear-gradient(180deg,rgba(18,16,15,0.2),#12100f_58%)]">
        <div
          className="relative min-h-0 flex-[1.05] bg-[linear-gradient(145deg,rgba(240,161,95,0.22),rgba(244,199,216,0.12)_46%,rgba(18,16,15,0.82))] bg-cover bg-center"
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

        <div className="flex flex-[0.95] flex-col justify-between p-6">
          <div>
            {visibleEmotions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {visibleEmotions.map((emotion) => (
                  <span key={emotion.id} className={emotionChipClassName}>
                    {getEmotionLabel(emotion)}
                  </span>
                ))}
                {hiddenEmotionCount > 0 ? (
                  <span className={emotionChipClassName}>
                    +{hiddenEmotionCount}
                  </span>
                ) : null}
              </div>
            ) : null}

            <p className="mt-5 text-2xl font-semibold leading-snug text-[#fff7ea]">
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
              <div>
                <p className="text-xs text-[#c9ad96]">기록한 사람</p>
                <p className="mt-1 text-sm font-semibold text-[#fff7ea]">
                  {authorName}
                </p>
              </div>
              <p className="max-w-[130px] text-right text-xs leading-5 text-[#f2b482]">
                영화가 남긴 마음을 기록하는 곳
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
