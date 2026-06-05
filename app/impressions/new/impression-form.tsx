"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  EmotionTag,
  getRelativeDateValue,
  WatchedDatePicker,
} from "@/components/ui";
import type { EmotionTone } from "@/lib/emotions";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
  upsertUserProfile,
} from "@/lib/supabase";
import {
  type WatchMethod,
  watchMethodOptions,
} from "@/lib/watch-methods";

type MovieOption = {
  id: string;
  title: string;
  poster_url: string | null;
  release_date: string | null;
};

type TmdbSearchResult = {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_url: string | null;
  release_date: string | null;
  genres: string[];
};

type MovieUpsertResult = {
  movie?: {
    id: string;
    slug: string | null;
    title: string;
    tmdb_id: number;
  };
  message?: string;
  detail?: string;
};

type EmotionOption = {
  id: string;
  name: string;
};

const missingSupabaseEnvMessage =
  "Supabase 환경변수가 설정되지 않았어요. .env.local을 확인해주세요.";

const emotionToneByName: Record<string, EmotionTone> = {
  먹먹함: "warm",
  설렘: "rose",
  위로됨: "violet",
  통쾌함: "warm",
  찝찝함: "violet",
  무서움: "violet",
  혼란스러움: "violet",
  따뜻함: "warm",
  슬픔: "rose",
  웃김: "warm",
  압도됨: "rose",
  "여운 남음": "warm",
};

function getLoginPath() {
  return `/login?next=${encodeURIComponent("/impressions/new")}`;
}

function getRequestedMovieId() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("movieId");
}

function getEmotionTone(emotionName: string): EmotionTone {
  return emotionToneByName[emotionName] ?? "warm";
}

function getReleaseYear(releaseDate: string | null) {
  return releaseDate?.slice(0, 4) || "개봉 연도 미정";
}

function getOverviewPreview(overview: string | null) {
  if (!overview) {
    return "아직 줄거리 소개가 준비되지 않았어요.";
  }

  return overview.length > 110 ? `${overview.slice(0, 110)}...` : overview;
}

export function ImpressionForm() {
  const router = useRouter();
  const movieSearchInputRef = useRef<HTMLInputElement>(null);
  const isSupabaseConfigured = hasSupabaseConfig();
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [emotions, setEmotions] = useState<EmotionOption[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedEmotionIds, setSelectedEmotionIds] = useState<string[]>([]);
  const [oneLine, setOneLine] = useState("");
  const [memorableScene, setMemorableScene] = useState("");
  const [personalSentence, setPersonalSentence] = useState("");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState("");
  const [watchedAt, setWatchedAt] = useState(() =>
    getRelativeDateValue(0),
  );
  const [watchMethod, setWatchMethod] = useState<WatchMethod | "">("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] =
    useState(isSupabaseConfigured);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    isSupabaseConfigured ? "" : missingSupabaseEnvMessage,
  );
  const [movieSelectionMessage, setMovieSelectionMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [movieSearchResults, setMovieSearchResults] = useState<
    TmdbSearchResult[]
  >([]);
  const [hasSearchedMovies, setHasSearchedMovies] = useState(false);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [selectingTmdbMovieId, setSelectingTmdbMovieId] = useState<
    number | null
  >(null);
  const [movieSearchError, setMovieSearchError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function loadFormOptions() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError) {
        console.error("Supabase getUser failed", userError);
      }

      if (!userData.user) {
        router.replace(getLoginPath());
        return;
      }

      const [moviesResult, emotionsResult] = await Promise.all([
        supabase
          .from("movies")
          .select("id, title, poster_url, release_date")
          .order("title"),
        supabase.from("emotions").select("id, name").order("name"),
      ]);

      if (!isMounted) {
        return;
      }

      if (moviesResult.error) {
        console.error("Supabase movies load failed", moviesResult.error);
        setErrorMessage(
          `영화 목록을 불러오지 못했어요. ${moviesResult.error.message}`,
        );
      }

      if (emotionsResult.error) {
        console.error("Supabase emotions load failed", emotionsResult.error);
        setErrorMessage(
          `감정 목록을 불러오지 못했어요. ${emotionsResult.error.message}`,
        );
      }

      const loadedMovies = (moviesResult.data ?? []) as MovieOption[];
      const loadedEmotions = (emotionsResult.data ?? []) as EmotionOption[];
      const requestedMovieId = getRequestedMovieId();
      const requestedMovie = loadedMovies.find(
        (movie) => movie.id === requestedMovieId,
      );

      setMovies(loadedMovies);
      setEmotions(loadedEmotions);
      setSelectedMovieId(requestedMovie?.id ?? "");
      setMovieSelectionMessage(
        requestedMovieId && !requestedMovie
          ? "선택한 영화를 찾을 수 없어 직접 선택해주세요."
          : "",
      );
      setIsLoadingOptions(false);
    }

    loadFormOptions();

    return () => {
      isMounted = false;
    };
  }, [isSupabaseConfigured, router]);

  function toggleEmotion(emotionId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedEmotionIds((current) =>
      current.includes(emotionId)
        ? current.filter((item) => item !== emotionId)
        : [...current, emotionId],
    );
  }

  async function handleMovieSearch() {
    const trimmedQuery = movieSearchQuery.trim();
    setMovieSearchError("");
    setSuccessMessage("");

    if (!trimmedQuery) {
      setMovieSearchResults([]);
      setHasSearchedMovies(false);
      return;
    }

    setIsSearchingMovies(true);
    setHasSearchedMovies(true);

    try {
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(trimmedQuery)}`,
      );
      const data = (await response.json()) as {
        results?: TmdbSearchResult[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "영화를 검색하는 중 문제가 생겼어요.");
      }

      setMovieSearchResults(data.results ?? []);
    } catch (error) {
      console.error("TMDb impression movie search failed", error);
      setMovieSearchResults([]);
      setMovieSearchError("영화를 검색하는 중 문제가 생겼어요.");
    } finally {
      setIsSearchingMovies(false);
    }
  }

  function handleMovieSearchKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleMovieSearch();
    }
  }

  async function handleSelectSearchedMovie(movie: TmdbSearchResult) {
    setSelectingTmdbMovieId(movie.tmdb_id);
    setMovieSearchError("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/movies/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tmdb_id: movie.tmdb_id }),
      });
      const data = (await response.json()) as MovieUpsertResult;

      if (!response.ok || !data.movie?.id) {
        console.error("Impression movie upsert response failed", {
          status: response.status,
          payload: data,
        });

        throw new Error(
          data.message ||
            data.detail ||
            "영화 정보를 저장하는 중 문제가 생겼어요.",
        );
      }

      const selectedMovie = {
        id: data.movie.id,
        title: data.movie.title || movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
      };

      setMovies((currentMovies) => {
        const existingMovie = currentMovies.find(
          (item) => item.id === selectedMovie.id,
        );

        if (existingMovie) {
          return currentMovies.map((item) =>
            item.id === selectedMovie.id ? selectedMovie : item,
          );
        }

        return [selectedMovie, ...currentMovies];
      });
      setSelectedMovieId(selectedMovie.id);
      setMovieSelectionMessage("");
      setMovieSearchQuery("");
      setMovieSearchResults([]);
      setHasSearchedMovies(false);
    } catch (error) {
      console.error("Impression movie upsert failed", error);
      setMovieSearchError("영화 정보를 저장하는 중 문제가 생겼어요.");
    } finally {
      setSelectingTmdbMovieId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedMovieId) {
      setErrorMessage("영화를 선택해주세요.");
      return;
    }

    if (selectedEmotionIds.length === 0) {
      setErrorMessage("마음에 남은 감정을 하나 이상 골라주세요.");
      return;
    }

    const trimmedOneLine = oneLine.trim();

    if (!trimmedOneLine) {
      setErrorMessage("한 줄 감상을 남겨주세요.");
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    setIsSubmitting(true);

    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase getUser failed", userError);
    }

    if (!userData.user) {
      setIsSubmitting(false);
      router.replace(getLoginPath());
      return;
    }

    const { error: profileError } = await upsertUserProfile(
      supabase,
      userData.user,
    );

    if (profileError) {
      console.error("Supabase profile upsert failed", profileError);
      setErrorMessage(`프로필을 준비하지 못했어요. ${profileError.message}`);
      setIsSubmitting(false);
      return;
    }

    const { data: impressionData, error: impressionError } = await supabase
      .from("impressions")
      .insert({
        user_id: userData.user.id,
        movie_id: selectedMovieId,
        one_line: trimmedOneLine,
        memorable_scene: memorableScene.trim() || null,
        personal_sentence: personalSentence.trim() || null,
        note: note.trim() || null,
        rating: rating ? Number(rating) : null,
        is_spoiler: isSpoiler,
        watched_at: watchedAt || null,
        watch_method: watchMethod || null,
      })
      .select("id")
      .single();

    if (impressionError) {
      console.error("Supabase impression insert failed", impressionError);
      setErrorMessage(`감상을 저장하지 못했어요. ${impressionError.message}`);
      setIsSubmitting(false);
      return;
    }

    const impression = impressionData as { id: string } | null;

    if (!impression?.id) {
      setErrorMessage("감상을 저장했지만 식별자를 받지 못했어요.");
      setIsSubmitting(false);
      return;
    }

    const emotionRows = selectedEmotionIds.map((emotionId) => ({
      impression_id: impression.id,
      emotion_id: emotionId,
    }));

    const { error: emotionLinkError } = await supabase
      .from("impression_emotions")
      .insert(emotionRows);

    if (emotionLinkError) {
      console.error(
        "Supabase impression_emotions insert failed",
        emotionLinkError,
      );
      setErrorMessage(
        `감정 태그를 저장하지 못했어요. ${emotionLinkError.message}`,
      );
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("감상이 저장됐어요. 나의 여운에서 다시 볼 수 있어요.");
    window.setTimeout(() => {
      router.push("/me");
      router.refresh();
    }, 900);
  }

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId);

  return (
    <Card className="mt-10 max-w-4xl p-6 sm:p-8">
      <form className="space-y-9" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="movie-search"
            className="text-sm font-medium text-[#f2b482]"
          >
            어떤 영화를 보셨나요?
          </label>
          <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
            영화 제목을 검색해 감상을 남겨보세요.
          </p>

          <div className="mt-4 rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={movieSearchInputRef}
                id="movie-search"
                type="search"
                value={movieSearchQuery}
                onChange={(event) => setMovieSearchQuery(event.target.value)}
                onKeyDown={handleMovieSearchKeyDown}
                disabled={isLoadingOptions}
                placeholder="영화 제목을 검색해보세요"
                className="min-h-12 flex-1 rounded-full border border-[#fff7ea]/12 bg-[#12100f] px-5 py-3 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={isSearchingMovies || isLoadingOptions}
                onClick={() => void handleMovieSearch()}
                className="shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearchingMovies ? "검색 중..." : "영화 찾기"}
              </Button>
            </div>

            {isSearchingMovies ? (
              <p className="mt-4 text-sm leading-6 text-[#c9ad96]">
                영화를 검색하는 중이에요.
              </p>
            ) : null}

            {movieSearchError ? (
              <p className="mt-4 rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm font-medium leading-6 text-[#f4c7d8]">
                {movieSearchError}
              </p>
            ) : null}

            {hasSearchedMovies &&
            !isSearchingMovies &&
            movieSearchResults.length === 0 &&
            !movieSearchError ? (
              <p className="mt-4 rounded-lg border border-dashed border-[#fff7ea]/14 bg-[#12100f]/36 px-4 py-5 text-center text-sm leading-6 text-[#c9ad96]">
                검색 결과가 없어요. 다른 제목으로 찾아볼까요?
              </p>
            ) : null}

            {movieSearchResults.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {movieSearchResults.slice(0, 6).map((movie) => (
                  <article
                    key={movie.tmdb_id}
                    className="flex overflow-hidden rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/48"
                  >
                    <div
                      aria-label={`${movie.title} 포스터`}
                      className="min-h-36 w-24 shrink-0 bg-[linear-gradient(145deg,rgba(240,161,95,0.24),rgba(244,199,216,0.12),rgba(18,16,15,0.88))] bg-cover bg-center"
                      role="img"
                      style={
                        movie.poster_url
                          ? { backgroundImage: `url(${movie.poster_url})` }
                          : undefined
                      }
                    />
                    <div className="flex min-w-0 flex-1 flex-col p-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-[#fff7ea]">
                          {movie.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#f2b482]">
                          {getReleaseYear(movie.release_date)}
                        </p>
                      </div>
                      <p className="mt-3 flex-1 text-sm leading-6 text-[#e7d4c0]">
                        {getOverviewPreview(movie.overview)}
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={selectingTmdbMovieId === movie.tmdb_id}
                        onClick={() => void handleSelectSearchedMovie(movie)}
                        className="mt-4 min-h-10 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {selectingTmdbMovieId === movie.tmdb_id
                          ? "선택 중..."
                          : "이 영화 선택하기"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          {movieSelectionMessage ? (
            <p className="mt-4 rounded-lg border border-[#f0a15f]/20 bg-[#f0a15f]/10 px-4 py-3 text-sm leading-6 text-[#ffd3a3]">
              {movieSelectionMessage}
            </p>
          ) : null}

          {selectedMovie ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 sm:flex">
              <div
                aria-label={`${selectedMovie.title} 포스터`}
                className="min-h-44 bg-[linear-gradient(145deg,rgba(240,161,95,0.28),rgba(244,199,216,0.14),rgba(18,16,15,0.88))] bg-cover bg-center sm:w-32 sm:shrink-0"
                role="img"
                style={
                  selectedMovie.poster_url
                    ? { backgroundImage: `url(${selectedMovie.poster_url})` }
                    : undefined
                }
              />
              <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f2b482]">
                    선택된 영화
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#fff7ea]">
                    {selectedMovie.title}
                  </p>
                  <p className="mt-1 text-sm text-[#ffd3a3]">
                    {getReleaseYear(selectedMovie.release_date)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setMovieSearchQuery("");
                    setMovieSearchResults([]);
                    setHasSearchedMovies(false);
                    setMovieSelectionMessage("");
                    movieSearchInputRef.current?.focus();
                  }}
                  className="min-h-10 px-4 py-2 text-sm"
                >
                  다른 영화 찾기
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-[#f2b482]">
            마음에 남은 감정
          </legend>
          <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
            하나만 골라도, 여러 개를 골라도 괜찮아요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {emotions.length > 0 ? (
              emotions.map((emotion) => (
                <EmotionTag
                  key={emotion.id}
                  selected={selectedEmotionIds.includes(emotion.id)}
                  tone={getEmotionTone(emotion.name)}
                  onClick={() => toggleEmotion(emotion.id)}
                >
                  {emotion.name}
                </EmotionTag>
              ))
            ) : (
              <p className="rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 px-4 py-3 text-sm leading-6 text-[#c9ad96]">
                {isLoadingOptions
                  ? "감정을 불러오는 중이에요."
                  : "아직 선택할 수 있는 감정이 없어요. 잠시 후 다시 시도해주세요."}
              </p>
            )}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="one-line-impression"
            className="flex items-center gap-2 text-sm font-medium text-[#f2b482]"
          >
            한 줄만 남겨도 괜찮아요
            <span className="rounded-full bg-[#f0a15f]/14 px-2 py-1 text-xs text-[#ffd3a3]">
              필수
            </span>
          </label>
          <textarea
            id="one-line-impression"
            name="oneLineImpression"
            rows={3}
            maxLength={90}
            required
            value={oneLine}
            onChange={(event) => setOneLine(event.target.value)}
            placeholder="영화가 끝나고 어떤 마음이 남았나요?"
            className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="memorable-scene"
              className="text-sm font-medium text-[#f2b482]"
            >
              인상 깊었던 장면
            </label>
            <textarea
              id="memorable-scene"
              name="memorableScene"
              rows={3}
              value={memorableScene}
              onChange={(event) => setMemorableScene(event.target.value)}
              placeholder="오래 남은 장면이나 순간을 적어보세요."
              className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
            />
          </div>

          <div>
            <label
              htmlFor="personal-sentence"
              className="text-sm font-medium text-[#f2b482]"
            >
              오늘의 문장
            </label>
            <textarea
              id="personal-sentence"
              name="personalSentence"
              rows={3}
              value={personalSentence}
              onChange={(event) => setPersonalSentence(event.target.value)}
              placeholder="이 영화를 보고 남은 나만의 문장을 적어보세요."
              className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="longer-note"
            className="text-sm font-medium text-[#f2b482]"
          >
            조금 더 남기고 싶은 감상
          </label>
          <textarea
            id="longer-note"
            name="longerNote"
            rows={5}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="기억하고 싶은 장면이나 감정을 자유롭게 적어보세요."
            className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="rating"
              className="text-sm font-medium text-[#c9ad96]"
            >
              별점은 남기고 싶을 때만
            </label>
            <select
              id="rating"
              name="rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="mt-3 w-full rounded-lg border border-[#fff7ea]/10 bg-[#12100f] px-4 py-3 text-[#e7d4c0] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
            >
              <option value="">남기지 않기</option>
              <option value="1">1점</option>
              <option value="2">2점</option>
              <option value="3">3점</option>
              <option value="4">4점</option>
              <option value="5">5점</option>
            </select>
          </div>

          <WatchedDatePicker value={watchedAt} onChange={setWatchedAt} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-[#f2b482]">
            어디에서 보셨나요?
          </legend>
          <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
            기억나면 가볍게 골라주세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {watchMethodOptions.map((method) => (
              <EmotionTag
                key={method.value}
                selected={watchMethod === method.value}
                tone="warm"
                onClick={() =>
                  setWatchMethod((current) =>
                    current === method.value ? "" : method.value,
                  )
                }
              >
                {method.label}
              </EmotionTag>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-3 rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 px-4 py-3 text-sm leading-6 text-[#e7d4c0]">
          <input
            name="hasSpoiler"
            type="checkbox"
            checked={isSpoiler}
            onChange={(event) => setIsSpoiler(event.target.checked)}
            className="h-4 w-4 accent-[#f0a15f]"
          />
          스포일러가 포함되어 있어요
        </label>

        {errorMessage ? (
          <p className="rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm font-medium leading-6 text-[#f4c7d8]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 px-4 py-3 text-sm font-medium text-[#ffd3a3]">
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={
              isLoadingOptions ||
              isSubmitting ||
              !selectedMovieId ||
              emotions.length === 0
            }
          >
            {isSubmitting ? "감상을 저장하는 중이에요" : "감상 남기기"}
          </Button>
          <p className="text-sm leading-6 text-[#c9ad96]">
            저장 후 나의 여운에서 다시 볼 수 있어요.
          </p>
        </div>
      </form>
    </Card>
  );
}
