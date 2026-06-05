import { forwardRef, type ReactElement } from "react";
import { PosterLayout } from "@/components/share/share-card-layouts/poster-layout";
import { QuoteLayout } from "@/components/share/share-card-layouts/quote-layout";
import { TicketLayoutOne } from "@/components/share/share-card-layouts/ticket-layout-one";
import { TicketLayoutTwo } from "@/components/share/share-card-layouts/ticket-layout-two";
import {
  shareCardLayoutOptions,
  type ShareCardLayout,
  type ShareCardLayoutProps,
} from "@/components/share/share-card-layouts/shared";
import { getProxiedImageUrl } from "@/lib/image-proxy";

type ImpressionShareCardProps = ShareCardLayoutProps & {
  layout?: ShareCardLayout;
};

const layoutComponents = {
  poster: PosterLayout,
  quote: QuoteLayout,
  "ticket-one": TicketLayoutOne,
  "ticket-two": TicketLayoutTwo,
} satisfies Record<
  ShareCardLayout,
  (props: ShareCardLayoutProps) => ReactElement
>;

export type ImpressionShareCardLayout = ShareCardLayout;
export { shareCardLayoutOptions };

export const ImpressionShareCard = forwardRef<
  HTMLDivElement,
  ImpressionShareCardProps
>(function ImpressionShareCard({ layout = "poster", ...props }, ref) {
  const LayoutComponent = layoutComponents[layout];
  const posterUrl = getProxiedImageUrl(props.posterUrl);

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-lg border border-[#fff7ea]/14 bg-[#0d0a09] text-[#fff7ea] shadow-[0_34px_110px_rgba(0,0,0,0.5)]"
    >
      <LayoutComponent {...props} posterUrl={posterUrl} />
    </div>
  );
});
