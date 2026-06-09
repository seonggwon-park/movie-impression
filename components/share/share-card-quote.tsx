type ShareCardQuoteVariant =
  | "poster"
  | "quote"
  | "ticket-one"
  | "ticket-two";

type ShareCardQuoteSize = "short" | "mediumLarge" | "medium" | "small" | "compact";

type ShareCardQuoteProps = {
  text: string;
  variant: ShareCardQuoteVariant;
  className?: string;
};

const quoteMaxLengthByVariant = {
  poster: 132,
  quote: 156,
  "ticket-one": 118,
  "ticket-two": 112,
} satisfies Record<ShareCardQuoteVariant, number>;

const quoteClassNames = {
  poster: {
    short: "text-[24px] leading-snug",
    mediumLarge: "text-[22px] leading-snug",
    medium: "text-[20px] leading-[1.45]",
    small: "text-[18px] leading-[1.48]",
    compact: "text-[16px] leading-[1.52]",
  },
  quote: {
    short: "text-[31px] leading-tight",
    mediumLarge: "text-[28px] leading-snug",
    medium: "text-[25px] leading-[1.38]",
    small: "text-[22px] leading-[1.44]",
    compact: "text-[19px] leading-[1.5]",
  },
  "ticket-one": {
    short: "text-[20px] leading-snug",
    mediumLarge: "text-[19px] leading-snug",
    medium: "text-[17px] leading-[1.42]",
    small: "text-[16px] leading-[1.46]",
    compact: "text-[14px] leading-[1.52]",
  },
  "ticket-two": {
    short: "text-[21px] leading-snug",
    mediumLarge: "text-[19px] leading-snug",
    medium: "text-[17px] leading-[1.42]",
    small: "text-[15px] leading-[1.48]",
    compact: "text-[13px] leading-[1.52]",
  },
} satisfies Record<ShareCardQuoteVariant, Record<ShareCardQuoteSize, string>>;

const baseQuoteClassName =
  "font-semibold text-[#fff7ea] whitespace-normal [word-break:keep-all] [overflow-wrap:break-word]";

function getQuoteLength(text: string) {
  return Array.from(text.replace(/\s/g, "")).length;
}

function getQuoteSize(text: string): ShareCardQuoteSize {
  const length = getQuoteLength(text);

  if (length <= 18) {
    return "short";
  }

  if (length <= 40) {
    return "mediumLarge";
  }

  if (length <= 70) {
    return "medium";
  }

  if (length <= 110) {
    return "small";
  }

  return "compact";
}

function getClampedQuote(text: string, maxLength: number) {
  const trimmedText = text.trim();
  const characters = Array.from(trimmedText);

  if (characters.length <= maxLength) {
    return trimmedText;
  }

  return `${characters.slice(0, maxLength).join("").trimEnd()}...`;
}

export function ShareCardQuote({
  text,
  variant,
  className = "",
}: ShareCardQuoteProps) {
  const displayText = getClampedQuote(text, quoteMaxLengthByVariant[variant]);
  const size = getQuoteSize(displayText);

  return (
    <p
      className={[
        baseQuoteClassName,
        quoteClassNames[variant][size],
        className,
      ].join(" ")}
    >
      “{displayText}”
    </p>
  );
}
