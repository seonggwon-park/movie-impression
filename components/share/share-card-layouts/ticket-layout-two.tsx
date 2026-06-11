import {
  EmotionChips,
  PosterBackdrop,
  type ShareCardLayoutProps,
} from "@/components/share/share-card-layouts/shared";
import { ShareCardStarRating } from "@/components/share/share-card-rating";
import { ShareCardQuote } from "@/components/share/share-card-quote";

function TicketEdgeNotches() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -left-5 top-1/2 z-30 h-10 w-10 -translate-y-1/2 rounded-full border border-[#d9a15f]/18 bg-[#0d0a09]"
      />
      <span
        aria-hidden="true"
        className="absolute -right-5 top-1/2 z-30 h-10 w-10 -translate-y-1/2 rounded-full border border-[#d9a15f]/18 bg-[#0d0a09]"
      />
    </>
  );
}

function TicketDivider() {
  return (
    <div className="relative h-6 shrink-0 border-x border-[#d9a15f]/28 bg-[#140d0c]">
      <TicketEdgeNotches />
      <div
        aria-hidden="true"
        className="absolute left-5 right-5 top-1/2 -translate-y-1/2 border-t border-dashed border-[#d9a15f]/42"
      />
      <div
        aria-hidden="true"
        className="absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,211,163,0.28),transparent)]"
      />
    </div>
  );
}

function TicketMetaItem({
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
    <div className="min-w-0 rounded-md border border-[#fff7ea]/8 bg-[#0b0706]/32 px-2.5 py-2">
      <p className="text-[8px] font-semibold tracking-[0.2em] text-[#d9a15f]/78">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold leading-none text-[#fff7ea]">
        {value}
      </p>
    </div>
  );
}

function TicketRatingMetaItem({ rating }: { rating: number | null }) {
  if (!rating) {
    return null;
  }

  return (
    <div className="min-w-0 rounded-md border border-[#fff7ea]/8 bg-[#0b0706]/32 px-2.5 py-2">
      <p className="text-[8px] font-semibold tracking-[0.2em] text-[#d9a15f]/78">
        RATING
      </p>
      <ShareCardStarRating
        rating={rating}
        className="mt-1"
        starClassName="text-[12px]"
      />
    </div>
  );
}

export function TicketLayoutTwo({
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
  const hasMeta = Boolean(watchMethodLabel || rating || watchedDate);

  return (
    <div className="relative h-full overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(140,68,62,0.34),transparent_35%),linear-gradient(160deg,#080504,#1a100d_54%,#0b0706)] p-3 text-[#fff7ea]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(110deg,rgba(217,161,95,0.1),transparent_42%,rgba(244,199,216,0.07))]"
      />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#d9a15f]/34 bg-[#130d0c] shadow-[inset_0_0_0_1px_rgba(255,247,234,0.045)]">
        <PosterBackdrop
          posterUrl={posterUrl}
          className="relative h-[238px] shrink-0 overflow-hidden border-b border-[#d9a15f]/20"
          overlay="linear-gradient(180deg,rgba(8,5,4,0.22),rgba(13,8,7,0.42)_42%,rgba(10,6,5,0.92))"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_32%_18%,rgba(255,211,163,0.2),transparent_30%),linear-gradient(120deg,rgba(88,42,31,0.18),transparent_52%,rgba(6,4,3,0.42))]"
          />

          <div className="absolute left-5 right-5 top-5 z-10 flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.26em] text-[#ffd3a3]">
                YEOUN ARCHIVE
              </p>
              <p className="mt-1 text-[8px] font-semibold tracking-[0.22em] text-[#e7d4c0]/78">
                CINEMA MEMORY TICKET
              </p>
            </div>
            <p className="whitespace-nowrap rounded-full border border-[#d9a15f]/32 bg-[#100907]/58 px-2.5 py-1 text-[8px] font-semibold tracking-[0.18em] text-[#ffd3a3]">
              ARCHIVE 02
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
            <p className="text-[9px] font-semibold tracking-[0.22em] text-[#d9a15f]/86">
              FEATURE
            </p>
            <h3 className="mt-1.5 text-[27px] font-semibold leading-[1.08] text-[#fff7ea] [word-break:keep-all]">
              {movieTitle}
            </h3>
            {releaseYear ? (
              <p className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#d9a15f]/30 bg-[#100907]/55 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#fff0d8]">
                <span className="text-[#d9a15f]/78">YEAR</span>
                <span>{releaseYear}</span>
              </p>
            ) : null}
          </div>
        </PosterBackdrop>

        <TicketDivider />

        <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,#150e0d,#0d0908)] px-4 pb-4 pt-3">
          <section className="shrink-0">
            <div className="flex items-center gap-3">
              <p className="whitespace-nowrap text-[9px] font-semibold tracking-[0.24em] text-[#d9a15f]/82">
                MOOD
              </p>
              <span className="h-px flex-1 bg-[#fff7ea]/10" />
            </div>
            <EmotionChips
              emotions={emotions}
              density="micro"
              className="mt-2 [gap:0.25rem]"
            />
          </section>

          <section className="mt-3 shrink-0 rounded-xl border border-[#fff7ea]/9 bg-[#fff7ea]/5 px-3.5 py-3 shadow-[inset_0_0_24px_rgba(217,161,95,0.035)]">
            <p className="text-[9px] font-semibold tracking-[0.22em] text-[#d9a15f]/78">
              MEMORY NOTE
            </p>
            <ShareCardQuote
              text={quote}
              variant="ticket-two"
              className="mt-1.5"
            />
          </section>

          {hasMeta ? (
            <section className="mt-3 grid shrink-0 grid-cols-3 gap-2">
              <TicketMetaItem label="PLACE" value={watchMethodLabel} />
              <TicketRatingMetaItem rating={rating} />
              <TicketMetaItem label="DATE" value={watchedDate} />
            </section>
          ) : null}

          <footer className="mt-3 flex min-h-[54px] shrink-0 items-end justify-between gap-3 border-t border-[#d9a15f]/18 pt-3">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-[#d9a15f]/78">
                COLLECTED BY
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[#fff7ea]">
                {authorName}
              </p>
            </div>
            <p className="shrink-0 whitespace-nowrap text-right text-[10px] leading-none text-[#f2b482]">
              영화가 남긴 마음을 기록하는 곳
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
