export type EmotionTone = "warm" | "rose" | "violet";

export type EmotionOption = {
  label: string;
  tone: EmotionTone;
};

export type MovieImpression = {
  author: string;
  emotion: string;
  note: string;
  date: string;
  rating?: string;
};

export type CriticReview = {
  criticName: string;
  outlet: string;
  rating?: string;
  summary: string;
  sourceUrl: string;
};

export type Movie = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  releaseYear: string;
  genre: string;
  runningTime: string;
  director: string;
  mainEmotion: string;
  emotionTone: EmotionTone;
  shortDescription: string;
  synopsis: string;
  impressionCount: number;
  emotionDistribution: Array<{
    emotion: string;
    percent: number;
    tone: EmotionTone;
  }>;
  impressions: MovieImpression[];
  criticReviews: CriticReview[];
};

export type MyImpression = {
  id: string;
  movieTitle: string;
  movieSlug: string;
  emotions: string[];
  note: string;
  longerNote?: string;
  watchedAt: string;
  rating?: string;
};

export const emotionOptions = [
  { label: "먹먹함", tone: "warm" },
  { label: "설렘", tone: "rose" },
  { label: "위로됨", tone: "violet" },
  { label: "통쾌함", tone: "warm" },
  { label: "찝찝함", tone: "violet" },
  { label: "압도됨", tone: "rose" },
  { label: "여운 남음", tone: "warm" },
] satisfies EmotionOption[];

export const featuredImpressions = [
  {
    movieTitle: "괴물",
    emotion: "먹먹함",
    impression: "좋은 영화라기보다 오래 마음에 남는 영화였어요.",
  },
  {
    movieTitle: "라라랜드",
    emotion: "설렘",
    impression: "끝난 뒤에도 음악이 계속 남아 있었어요.",
  },
  {
    movieTitle: "듄: 파트2",
    emotion: "압도됨",
    impression: "극장에서 봐야 하는 이유를 다시 느꼈어요.",
  },
] as const;

export const placeholderMovies = [
  {
    id: "1",
    slug: "pamyo",
    title: "파묘",
    originalTitle: "Exhuma",
    releaseYear: "2024",
    genre: "미스터리",
    runningTime: "134분",
    director: "장재현",
    mainEmotion: "찝찝함",
    emotionTone: "violet",
    shortDescription: "상영관을 나와서도 장면의 온도가 쉽게 식지 않는 영화.",
    synopsis:
      "오래 묻혀 있던 이야기가 천천히 드러나며, 낯선 공기와 불길한 감정을 남깁니다.",
    impressionCount: 182,
    emotionDistribution: [
      { emotion: "찝찝함", percent: 38, tone: "violet" },
      { emotion: "압도됨", percent: 24, tone: "rose" },
      { emotion: "여운 남음", percent: 21, tone: "warm" },
    ],
    impressions: [
      {
        author: "해질녘",
        emotion: "찝찝함",
        note: "무섭다기보다 오래 남는 불편함이 있었어요.",
        date: "2026.05.18",
        rating: "4.0",
      },
      {
        author: "필름노트",
        emotion: "압도됨",
        note: "소리와 표정만으로도 극장의 공기가 바뀌는 느낌.",
        date: "2026.05.20",
      },
    ],
    criticReviews: [
      {
        criticName: "김혜리",
        outlet: "씨네21",
        rating: "★★★☆",
        summary: "장르의 익숙한 리듬 안에서 한국적인 불길함을 길게 남긴다.",
        sourceUrl: "https://www.cine21.com/",
      },
      {
        criticName: "이동진",
        outlet: "왓챠피디아",
        rating: "3.5/5",
        summary: "분위기와 배우들의 힘이 인상적인 오컬트 미스터리.",
        sourceUrl: "https://pedia.watcha.com/",
      },
    ],
  },
  {
    id: "2",
    slug: "inside-out-2",
    title: "인사이드 아웃 2",
    originalTitle: "Inside Out 2",
    releaseYear: "2024",
    genre: "애니메이션",
    runningTime: "96분",
    director: "켈시 만",
    mainEmotion: "위로됨",
    emotionTone: "violet",
    shortDescription: "복잡한 마음을 조금 더 다정하게 바라보게 만드는 이야기.",
    synopsis:
      "새로운 감정들이 찾아오며 흔들리는 마음을 통해, 성장의 어색함과 다정함을 함께 보여줍니다.",
    impressionCount: 146,
    emotionDistribution: [
      { emotion: "위로됨", percent: 42, tone: "violet" },
      { emotion: "먹먹함", percent: 23, tone: "warm" },
      { emotion: "설렘", percent: 18, tone: "rose" },
    ],
    impressions: [
      {
        author: "하루",
        emotion: "위로됨",
        note: "내 마음을 조금 덜 미워해도 되겠다고 느꼈어요.",
        date: "2026.05.22",
        rating: "4.5",
      },
      {
        author: "작은관객",
        emotion: "먹먹함",
        note: "가볍게 보러 갔다가 예상보다 오래 생각났어요.",
        date: "2026.05.24",
      },
    ],
    criticReviews: [
      {
        criticName: "정시우",
        outlet: "영화 저널",
        rating: "B+",
        summary: "성장의 어색함을 감정의 언어로 다정하게 풀어낸 속편.",
        sourceUrl: "https://www.rottentomatoes.com/",
      },
      {
        criticName: "박평식",
        outlet: "씨네21",
        summary: "전편의 온기를 잃지 않고 새로운 마음의 방을 연다.",
        sourceUrl: "https://www.cine21.com/",
      },
    ],
  },
  {
    id: "3",
    slug: "your-name",
    title: "너의 이름은.",
    originalTitle: "君の名は。",
    releaseYear: "2016",
    genre: "로맨스",
    runningTime: "106분",
    director: "신카이 마코토",
    mainEmotion: "여운 남음",
    emotionTone: "warm",
    shortDescription: "오래 지난 뒤에도 어떤 빛과 음악으로 다시 떠오르는 영화.",
    synopsis:
      "서로 다른 시간을 지나 마주하려는 두 사람의 감정이, 빛과 음악처럼 오래 남습니다.",
    impressionCount: 129,
    emotionDistribution: [
      { emotion: "여운 남음", percent: 44, tone: "warm" },
      { emotion: "설렘", percent: 29, tone: "rose" },
      { emotion: "먹먹함", percent: 16, tone: "violet" },
    ],
    impressions: [
      {
        author: "여름밤",
        emotion: "여운 남음",
        note: "마지막 장면이 오래도록 빛처럼 남았어요.",
        date: "2026.05.25",
        rating: "5.0",
      },
      {
        author: "밤의관객",
        emotion: "설렘",
        note: "다시 보고 싶은 마음이 먼저 들었어요.",
        date: "2026.05.27",
      },
    ],
    criticReviews: [
      {
        criticName: "이지혜",
        outlet: "필름 코멘트",
        rating: "★★★★",
        summary: "빛과 음악, 시간이 엇갈리는 감정을 강하게 각인한다.",
        sourceUrl: "https://www.imdb.com/",
      },
      {
        criticName: "허남웅",
        outlet: "무비스트",
        summary: "로맨스와 재난의 감각을 청춘의 떨림으로 엮어낸다.",
        sourceUrl: "https://www.movist.com/",
      },
    ],
  },
] satisfies Movie[];

export const myImpressions = [
  {
    id: "mine-1",
    movieTitle: "파묘",
    movieSlug: "pamyo",
    emotions: ["찝찝함", "압도됨"],
    note: "무섭다기보다 설명하기 어려운 불편함이 오래 남았어요.",
    longerNote:
      "극장을 나와서도 소리와 어둠의 질감이 계속 떠올랐어요. 무언가를 본다기보다 분위기 안에 잠시 들어갔다 나온 기분이었어요.",
    watchedAt: "2026.05.28",
    rating: "4.0",
  },
  {
    id: "mine-2",
    movieTitle: "인사이드 아웃 2",
    movieSlug: "inside-out-2",
    emotions: ["위로됨", "먹먹함"],
    note: "내 마음을 조금 덜 미워해도 되겠다고 느꼈어요.",
    longerNote:
      "새로운 감정들이 몰려오는 장면이 예상보다 크게 남았어요. 복잡한 마음도 결국 나를 지키려고 온다는 말처럼 느껴졌어요.",
    watchedAt: "2026.05.24",
    rating: "4.5",
  },
  {
    id: "mine-3",
    movieTitle: "너의 이름은.",
    movieSlug: "your-name",
    emotions: ["여운 남음", "설렘"],
    note: "마지막 장면이 오래도록 빛처럼 남았어요.",
    watchedAt: "2026.05.21",
    rating: "5.0",
  },
] satisfies MyImpression[];

export function getMovieByIdOrSlug(identifier: string) {
  return placeholderMovies.find(
    (movie) => movie.id === identifier || movie.slug === identifier,
  );
}
