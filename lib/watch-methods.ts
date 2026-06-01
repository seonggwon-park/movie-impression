export const watchMethodOptions = [
  { value: "theater", label: "영화관" },
  { value: "netflix", label: "넷플릭스" },
  { value: "disney_plus", label: "디즈니+" },
  { value: "watcha", label: "왓챠" },
  { value: "tving", label: "티빙" },
  { value: "wavve", label: "웨이브" },
  { value: "coupang_play", label: "쿠팡플레이" },
  { value: "other_ott", label: "기타 OTT" },
  { value: "tv", label: "TV" },
  { value: "rent_buy", label: "구매/대여" },
  { value: "home", label: "집에서" },
  { value: "other", label: "기타" },
] as const;

export type WatchMethod = (typeof watchMethodOptions)[number]["value"];

const watchMethodLabels = new Map(
  watchMethodOptions.map((method) => [method.value, method.label]),
);

export function isWatchMethod(value: string | null | undefined): value is WatchMethod {
  return Boolean(value && watchMethodLabels.has(value as WatchMethod));
}

export function getWatchMethodLabel(value: string | null | undefined) {
  return isWatchMethod(value) ? (watchMethodLabels.get(value) ?? null) : null;
}
