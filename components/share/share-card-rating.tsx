type ShareCardStarRatingProps = {
  rating: number | null;
  className?: string;
  starClassName?: string;
};

export function ShareCardStarRating({
  rating,
  className = "",
  starClassName = "text-[12px]",
}: ShareCardStarRatingProps) {
  if (!rating) {
    return null;
  }

  const filledStars = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      aria-label={`Rating ${filledStars} of 5`}
      className={`flex items-center gap-0.5 leading-none ${className}`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < filledStars;

        return (
          <span
            aria-hidden="true"
            className={`${starClassName} ${
              isFilled
                ? "text-[#ffd36e] drop-shadow-[0_0_5px_rgba(255,184,91,0.34)]"
                : "text-[#6f5748]/78"
            }`}
            key={index}
          >
            {"\u2605"}
          </span>
        );
      })}
    </div>
  );
}
