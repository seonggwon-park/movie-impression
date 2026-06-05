import {
  EmotionChips,
  PosterBackdrop,
  ShareCardFooter,
  ShareCardMeta,
  getPreviewText,
  type ShareCardLayoutProps,
} from "@/components/share/share-card-layouts/shared";

export function PosterLayout({
  movieTitle,
  releaseYear,
  posterUrl,
  emotions,
  quote,
  rating,
  watchedDate,
  watchMethodLabel,
  authorName,
}: ShareCardLayoutProps) {
  const displayQuote = getPreviewText(quote, 108);

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(240,161,95,0.24),transparent_36%),linear-gradient(180deg,rgba(18,16,15,0.18),#12100f_58%)]">
      <PosterBackdrop
        posterUrl={posterUrl}
        className="relative min-h-0 flex-[1.14]"
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
      </PosterBackdrop>

      <div className="flex flex-[0.86] flex-col justify-between px-6 pb-6 pt-6">
        <div>
          <EmotionChips emotions={emotions} />
          <p className="mt-5 text-[22px] font-semibold leading-snug text-[#fff7ea]">
            “{displayQuote}”
          </p>
        </div>

        <div>
          <ShareCardMeta
            rating={rating}
            watchedDate={watchedDate}
            watchMethodLabel={watchMethodLabel}
          />
          <ShareCardFooter authorName={authorName} className="mt-6" />
        </div>
      </div>
    </div>
  );
}
