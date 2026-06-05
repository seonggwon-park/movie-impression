import {
  EmotionChips,
  PosterBackdrop,
  getPreviewText,
  type ShareCardLayoutProps,
} from "@/components/share/share-card-layouts/shared";

function TicketNotch({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-1/2 z-30 h-10 w-10 -translate-y-1/2 rounded-full border border-[#fff7ea]/14 bg-[#050403] shadow-[inset_0_0_18px_rgba(255,211,163,0.08)] ${
        side === "left" ? "-left-5" : "-right-5"
      }`}
    />
  );
}

function TicketPerforation() {
  return (
    <div className="relative h-7 shrink-0 bg-[#15100e]">
      <TicketNotch side="left" />
      <TicketNotch side="right" />
      <div
        aria-hidden="true"
        className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t border-dashed border-[#ffd3a3]/38"
      />
      <div
        aria-hidden="true"
        className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,211,163,0.26),transparent)]"
      />
    </div>
  );
}

function TicketInfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="min-w-0 rounded-md border border-[#fff7ea]/8 bg-[#0d0a09]/32 px-3 py-2">
      <p className="text-[9px] font-semibold tracking-[0.18em] text-[#f2b482]/78">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold text-[#fff7ea]">
        {value}
      </p>
    </div>
  );
}

export function TicketLayoutOne({
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
  const displayQuote = getPreviewText(quote, 96);

  return (
    <div className="relative h-full bg-[radial-gradient(circle_at_top_left,rgba(240,161,95,0.2),transparent_34%),linear-gradient(180deg,#15100e,#0b0807_72%)] p-3">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#ffd3a3]/24 bg-[#15100e] shadow-[inset_0_0_0_1px_rgba(255,247,234,0.045)]">
        <PosterBackdrop
          posterUrl={posterUrl}
          className="relative min-h-0 flex-[0.9]"
          overlay="linear-gradient(180deg,rgba(18,16,15,0.04),rgba(18,16,15,0.76))"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(13,10,9,0.42),transparent)]"
          />
          <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
            <p className="whitespace-nowrap text-[10px] font-semibold tracking-[0.24em] text-[#ffd3a3]">
              YEOUN TICKET
            </p>
            <p className="whitespace-nowrap rounded-full border border-[#fff7ea]/16 bg-[#0d0a09]/42 px-2.5 py-1 text-[9px] font-semibold tracking-[0.16em] text-[#e7d4c0]">
              ADMIT ONE
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-[30px] font-semibold leading-tight text-[#fff7ea]">
              {movieTitle}
            </h3>
            {releaseYear ? (
              <p className="mt-2 text-sm font-medium text-[#e7d4c0]">
                {releaseYear}
              </p>
            ) : null}
          </div>
        </PosterBackdrop>

        <TicketPerforation />

        <div className="relative flex min-h-0 flex-[1.1] flex-col justify-between px-5 pb-5 pt-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="whitespace-nowrap text-[10px] font-semibold tracking-[0.22em] text-[#f2b482]/82">
                MOOD
              </p>
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-[#fff7ea]/10"
              />
            </div>
            <EmotionChips
              emotions={emotions}
              density="compact"
              className="mt-3"
            />

            <div className="mt-4">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-[#f2b482]/82">
                NOTE
              </p>
              <p className="mt-2 text-[19px] font-semibold leading-snug text-[#fff7ea]">
                “{displayQuote}”
              </p>
            </div>
          </div>

          <div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <TicketInfoItem label="YEAR" value={releaseYear} />
              <TicketInfoItem
                label="RATING"
                value={rating ? `별점 ${rating}` : null}
              />
              <TicketInfoItem label="ISSUED" value={watchedDate} />
              <TicketInfoItem label="PLACE" value={watchMethodLabel} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#ffd3a3]/16 pt-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[#f2b482]/78">
                  BY
                </p>
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
}
