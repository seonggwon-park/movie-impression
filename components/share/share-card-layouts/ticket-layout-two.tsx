import {
  EmotionChips,
  PosterBackdrop,
  type ShareCardLayoutProps,
} from "@/components/share/share-card-layouts/shared";
import { ShareCardQuote } from "@/components/share/share-card-quote";

function CollectorInfo({
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
    <div className="min-w-0 border-l border-[#d7a766]/34 pl-3">
      <p className="text-[8px] font-semibold tracking-[0.24em] text-[#d7a766]/78">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold text-[#fff7ea]">
        {value}
      </p>
    </div>
  );
}

function CollectorNotches() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -left-4 top-[34%] z-20 h-8 w-8 rounded-full border border-[#f3c489]/16 bg-[#050403]"
      />
      <span
        aria-hidden="true"
        className="absolute -right-4 top-[34%] z-20 h-8 w-8 rounded-full border border-[#f3c489]/16 bg-[#050403]"
      />
      <span
        aria-hidden="true"
        className="absolute -left-3 bottom-[24%] z-20 h-6 w-6 rounded-full border border-[#f3c489]/14 bg-[#050403]"
      />
      <span
        aria-hidden="true"
        className="absolute -right-3 bottom-[24%] z-20 h-6 w-6 rounded-full border border-[#f3c489]/14 bg-[#050403]"
      />
    </>
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
  return (
    <div className="relative h-full bg-[linear-gradient(145deg,#080605,#17100b_46%,#0e0b0a)] p-3 text-[#fff7ea]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-[#d7a766]/34 bg-[#120e0c] shadow-[inset_0_0_0_1px_rgba(255,247,234,0.055)]">
        <CollectorNotches />
        <div
          aria-hidden="true"
          className="absolute inset-2 rounded-[14px] border border-[#fff7ea]/8"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-5 top-[37%] z-10 border-t border-dashed border-[#d7a766]/34"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-[25.5%] left-5 right-5 z-10 border-t border-dashed border-[#d7a766]/24"
        />

        <div className="relative z-10 flex items-center justify-between px-6 pt-5">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.28em] text-[#d7a766]">
              YEOUN COLLECTION
            </p>
            <p className="mt-1 text-[8px] font-semibold tracking-[0.22em] text-[#c9ad96]">
              CINEMA MEMORY PASS
            </p>
          </div>
          <p className="rounded-full border border-[#d7a766]/36 bg-[#2c1d12]/70 px-3 py-1 text-[9px] font-semibold tracking-[0.18em] text-[#ffd3a3]">
            No. YN
          </p>
        </div>

        <div className="relative z-10 mt-4 grid min-h-0 flex-[0.92] grid-cols-[0.48fr_0.52fr] gap-4 px-5">
          <PosterBackdrop
            posterUrl={posterUrl}
            className="min-h-0 overflow-hidden rounded-sm border border-[#d7a766]/22 shadow-[0_18px_46px_rgba(0,0,0,0.42)]"
            overlay="linear-gradient(180deg,rgba(18,16,15,0.02),rgba(18,16,15,0.16))"
          />

          <div className="flex min-w-0 flex-col justify-end pb-2">
            <p className="text-[8px] font-semibold tracking-[0.24em] text-[#d7a766]/82">
              FEATURE
            </p>
            <h3 className="mt-2 text-[23px] font-semibold leading-tight text-[#fff7ea]">
              {movieTitle}
            </h3>
            {releaseYear ? (
              <p className="mt-2 text-xs font-semibold tracking-[0.12em] text-[#c9ad96]">
                {releaseYear}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 flex flex-[1.1] flex-col justify-between px-6 pb-5 pt-5">
          <div>
            <div className="flex items-center gap-3">
              <p className="whitespace-nowrap text-[8px] font-semibold tracking-[0.24em] text-[#d7a766]/82">
                SELECTED MOOD
              </p>
              <span className="h-px flex-1 bg-[#fff7ea]/10" />
            </div>
            <EmotionChips
              emotions={emotions}
              density="compact"
              className="mt-3"
            />

            <ShareCardQuote
              text={quote}
              variant="ticket-two"
              className="mt-5"
            />
          </div>

          <div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <CollectorInfo
                label="RATING"
                value={rating ? `별점 ${rating}` : null}
              />
              <CollectorInfo label="DATE" value={watchedDate} />
              <CollectorInfo label="PLACE" value={watchMethodLabel} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#d7a766]/18 pt-4">
              <div className="min-w-0">
                <p className="text-[8px] font-semibold tracking-[0.24em] text-[#d7a766]/82">
                  COLLECTED BY
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
