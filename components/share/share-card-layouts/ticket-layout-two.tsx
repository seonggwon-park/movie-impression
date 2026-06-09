import {
  EmotionChips,
  PosterBackdrop,
  type ShareCardLayoutProps,
} from "@/components/share/share-card-layouts/shared";
import { ShareCardQuote } from "@/components/share/share-card-quote";

const softCinemaGrainStyle = {
  backgroundImage:
    "radial-gradient(circle at 18% 28%, rgba(255,247,234,0.24) 0 0.55px, transparent 0.8px), radial-gradient(circle at 78% 62%, rgba(242,180,130,0.18) 0 0.45px, transparent 0.75px)",
  backgroundSize: "11px 11px, 15px 15px",
};

function MemoryTicketNotches() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -left-3 top-[41%] z-20 h-6 w-6 rounded-full border border-[#f2b482]/16 bg-[#050403]"
      />
      <span
        aria-hidden="true"
        className="absolute -right-3 top-[41%] z-20 h-6 w-6 rounded-full border border-[#f2b482]/16 bg-[#050403]"
      />
      <span
        aria-hidden="true"
        className="absolute -left-2 bottom-[20%] z-20 h-4 w-4 rounded-full border border-[#f2b482]/12 bg-[#050403]"
      />
      <span
        aria-hidden="true"
        className="absolute -right-2 bottom-[20%] z-20 h-4 w-4 rounded-full border border-[#f2b482]/12 bg-[#050403]"
      />
    </>
  );
}

function SoftDivider() {
  return (
    <div className="relative my-4 h-3 shrink-0">
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-[#f2b482]/24"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/4 right-1/4 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(242,180,130,0.3),transparent)]"
      />
    </div>
  );
}

function MemoryMeta({
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
    <div className="min-w-0">
      <p className="text-[8px] font-semibold tracking-[0.18em] text-[#f2b482]/72">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold text-[#fff7ea]">
        {value}
      </p>
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
  const hasMetadata = Boolean(watchedDate || watchMethodLabel || rating);

  return (
    <div className="relative h-full bg-[radial-gradient(circle_at_22%_14%,rgba(118,52,60,0.42),transparent_34%),linear-gradient(155deg,#090605,#1c1112_48%,#0c0908)] px-3 pt-3 text-[#fff7ea]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-t-[24px] border-x border-t border-[#f2b482]/22 bg-[#150e0d] shadow-[inset_0_1px_0_rgba(255,247,234,0.055)]">
        <MemoryTicketNotches />

        <PosterBackdrop
          posterUrl={posterUrl}
          className="relative min-h-0 flex-[1.08] overflow-hidden"
          overlay="linear-gradient(180deg,rgba(8,6,5,0.44),rgba(18,12,11,0.5)_36%,rgba(9,6,5,0.94))"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(120deg,rgba(118,62,35,0.18),rgba(34,19,15,0.12)_48%,rgba(8,6,5,0.24))]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,4,3,0.48)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07]"
            style={softCinemaGrainStyle}
          />
          <div className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between gap-3">
            <p className="whitespace-nowrap text-[9px] font-semibold tracking-[0.24em] text-[#ffd3a3]">
              A MEMORY TICKET
            </p>
            <p className="whitespace-nowrap rounded-full border border-[#f2b482]/22 bg-[#160d0d]/54 px-2.5 py-1 text-[8px] font-semibold tracking-[0.18em] text-[#e7d4c0]">
              ARCHIVE 02
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
            <p className="text-[9px] font-semibold tracking-[0.22em] text-[#f2b482]/82">
              남은 장면
            </p>
            <h3 className="mt-2 text-[30px] font-semibold leading-tight text-[#fff7ea]">
              {movieTitle}
            </h3>
            {releaseYear ? (
              <p className="mt-2 text-sm font-medium text-[#e7d4c0]">
                {releaseYear}
              </p>
            ) : null}
          </div>
        </PosterBackdrop>

        <div className="relative z-10 flex min-h-0 flex-[0.92] flex-col justify-between px-5 pb-5 pt-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="whitespace-nowrap text-[9px] font-semibold tracking-[0.22em] text-[#f2b482]/78">
                마음에 남은 감정
              </p>
              <span className="h-px flex-1 bg-[#fff7ea]/10" />
            </div>
            <EmotionChips
              emotions={emotions}
              density="compact"
              className="mt-3"
            />

            <SoftDivider />

            <div className="rounded-xl border border-[#fff7ea]/8 bg-[#fff7ea]/5 px-4 py-4 shadow-[inset_0_0_22px_rgba(242,180,130,0.035)]">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-[#f2b482]/76">
                MEMORY NOTE
              </p>
              <ShareCardQuote
                text={quote}
                variant="ticket-two"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            {hasMetadata ? (
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-[#f2b482]/12 bg-[#0d0909]/38 px-4 py-3">
                <MemoryMeta label="관람일" value={watchedDate} />
                <MemoryMeta label="방식" value={watchMethodLabel} />
                <MemoryMeta
                  label="별점"
                  value={rating ? `${rating}` : null}
                />
              </div>
            ) : null}

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f2b482]/14 pt-4">
              <div className="min-w-0">
                <p className="text-[10px] text-[#c9ad96]">기록한 사람</p>
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
