import {
  EmotionChips,
  PosterBackdrop,
  ShareCardFooter,
  ShareCardMeta,
  getPosterBackgroundStyle,
  getPreviewText,
  type ShareCardLayoutProps,
} from "@/components/share/share-card-layouts/shared";

export function QuoteLayout({
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
  const displayQuote = getPreviewText(quote, 118);

  return (
    <div className="relative h-full overflow-hidden bg-[#100d0d]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-[0.42]"
        style={getPosterBackgroundStyle(
          posterUrl,
          "linear-gradient(180deg,rgba(18,16,15,0.48),rgba(18,16,15,0.88))",
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(244,199,216,0.24),transparent_34%),linear-gradient(180deg,rgba(13,10,9,0.18),#100d0d_72%)]"
      />

      <div className="relative flex h-full flex-col justify-between p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#ffd3a3]">여운</p>
            <h3 className="mt-3 text-xl font-semibold leading-tight text-[#fff7ea]">
              {movieTitle}
            </h3>
            {releaseYear ? (
              <p className="mt-1 text-sm text-[#e7d4c0]">{releaseYear}</p>
            ) : null}
          </div>

          <PosterBackdrop
            posterUrl={posterUrl}
            className="h-28 w-[76px] shrink-0 overflow-hidden rounded-md border border-[#fff7ea]/14 shadow-[0_18px_50px_rgba(0,0,0,0.38)]"
            overlay="linear-gradient(180deg,rgba(18,16,15,0.02),rgba(18,16,15,0.12))"
          />
        </div>

        <div className="my-6">
          <EmotionChips emotions={emotions} density="compact" />
          <p className="mt-6 text-[27px] font-semibold leading-snug text-[#fff7ea]">
            “{displayQuote}”
          </p>
        </div>

        <div>
          <ShareCardMeta
            rating={rating}
            watchedDate={watchedDate}
            watchMethodLabel={watchMethodLabel}
            className="text-[#e7d4c0]"
          />
          <ShareCardFooter authorName={authorName} className="mt-6" />
        </div>
      </div>
    </div>
  );
}
