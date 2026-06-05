"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import {
  ImpressionShareCard,
  shareCardLayoutOptions,
  type ImpressionShareCardLayout,
} from "@/components/share/impression-share-card";
import type { EmotionTone } from "@/lib/emotions";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";
import { getWatchMethodLabel } from "@/lib/watch-methods";

type MaybeArray<T> = T | T[] | null;

type SupabaseMovieRow = {
  id: string;
  title: string;
  slug: string | null;
  poster_url: string | null;
  release_date: string | null;
};

type SupabaseEmotionRow = {
  id: string;
  name: string;
  emoji: string | null;
};

type SupabaseProfileRow = {
  display_name: string | null;
  nickname: string | null;
};

type SupabaseImpressionRow = {
  id: string;
  one_line: string;
  memorable_scene: string | null;
  personal_sentence: string | null;
  note: string | null;
  rating: number | null;
  watched_at: string | null;
  watch_method: string | null;
  created_at: string | null;
  movies: MaybeArray<SupabaseMovieRow>;
  impression_emotions:
    | Array<{
        emotions: MaybeArray<SupabaseEmotionRow>;
      }>
    | null;
};

type MovieView = {
  id: string;
  title: string;
  slug: string | null;
  posterUrl: string | null;
  releaseDate: string | null;
};

type EmotionView = {
  id: string;
  name: string;
  emoji: string | null;
};

type ImpressionView = {
  id: string;
  oneLine: string;
  memorableScene: string | null;
  personalSentence: string | null;
  note: string | null;
  rating: number | null;
  watchedAt: string | null;
  watchMethod: string | null;
  createdAt: string | null;
  movie: MovieView;
  emotions: EmotionView[];
};

const missingSupabaseEnvMessage =
  "Supabase 환경변수가 설정되지 않았어요. .env.local을 확인해주세요.";
const shareCardExportWidth = 360;
const shareCardExportHeight = 640;
const shareCardExportPixelRatio = 3;
const minimumShareCardBlobSize = 12_000;
const transparentImagePlaceholder =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

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
  return `/login?next=${encodeURIComponent("/me")}`;
}

function getEmotionTone(emotionName: string): EmotionTone {
  return emotionToneByName[emotionName] ?? "warm";
}

function getSingleRelation<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getReleaseYear(value: string | null) {
  return value ? value.slice(0, 4) : null;
}

function getMovieHref(movie: MovieView) {
  return `/movies/${movie.slug || movie.id}`;
}

function getNotePreview(note: string) {
  return note.length > 150 ? `${note.slice(0, 150)}...` : note;
}

function normalizeImpression(row: SupabaseImpressionRow): ImpressionView {
  const movie = getSingleRelation(row.movies);
  const emotions =
    row.impression_emotions
      ?.map((item) => getSingleRelation(item.emotions))
      .filter((emotion): emotion is SupabaseEmotionRow => Boolean(emotion)) ??
    [];

  return {
    id: row.id,
    oneLine: row.one_line,
    memorableScene: row.memorable_scene,
    personalSentence: row.personal_sentence,
    note: row.note,
    rating: row.rating,
    watchedAt: row.watched_at,
    watchMethod: row.watch_method,
    createdAt: row.created_at,
    movie: {
      id: movie?.id ?? "",
      title: movie?.title ?? "제목 없는 영화",
      slug: movie?.slug ?? null,
      posterUrl: movie?.poster_url ?? null,
      releaseDate: movie?.release_date ?? null,
    },
    emotions,
  };
}

function getMostUsedEmotion(impressions: ImpressionView[]) {
  const counts = impressions
    .flatMap((impression) => impression.emotions)
    .reduce<Record<string, { emotion: EmotionView; count: number }>>(
      (current, emotion) => ({
        ...current,
        [emotion.name]: {
          emotion,
          count: (current[emotion.name]?.count ?? 0) + 1,
        },
      }),
      {},
    );

  return Object.values(counts).sort((a, b) => b.count - a.count)[0]?.emotion;
}

function getRecentEmotions(impressions: ImpressionView[]) {
  return impressions
    .flatMap((impression) =>
      impression.emotions.map((emotion) => ({
        id: `${impression.id}-${emotion.id}`,
        emotion,
        movieTitle: impression.movie.title,
        date: impression.watchedAt ?? impression.createdAt,
      })),
    )
    .slice(0, 6);
}

function getEmotionLabel(emotion: EmotionView) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

function getSafeDownloadFileName(movieTitle: string) {
  const safeTitle = movieTitle
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);

  return `yeoun-${safeTitle || "movie"}.png`;
}

function getShareCardAuthorName(
  nickname: string,
  displayName: string,
  emailPrefix: string,
) {
  const trimmedNickname = nickname.trim();
  const trimmedDisplayName = displayName.trim();
  const trimmedEmailPrefix = emailPrefix.trim();

  if (trimmedNickname) {
    return trimmedNickname;
  }

  if (trimmedDisplayName && trimmedDisplayName !== trimmedEmailPrefix) {
    return trimmedDisplayName;
  }

  return "여운 사용자";
}

function downloadObjectUrl(objectUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function getCssImageUrls(value: string) {
  const urls: string[] = [];
  const cssUrlPattern = /url\((['"]?)(.*?)\1\)/g;
  let match = cssUrlPattern.exec(value);

  while (match) {
    const url = match[2]?.trim();

    if (url && !url.startsWith("data:")) {
      urls.push(url);
    }

    match = cssUrlPattern.exec(value);
  }

  return urls;
}

function getShareCardBackgroundImageUrls(target: HTMLElement) {
  const elements = [target, ...Array.from(target.querySelectorAll("*"))];
  const urls = new Set<string>();

  elements.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    getCssImageUrls(window.getComputedStyle(element).backgroundImage).forEach(
      (url) => urls.add(url),
    );
  });

  return Array.from(urls);
}

function preloadImageUrl(url: string) {
  return new Promise<{ url: string; didLoad: boolean }>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      resolve({ url, didLoad: false });
    }, 4500);

    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve({ url, didLoad: image.naturalWidth > 0 });
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve({ url, didLoad: false });
    };
    image.src = url;
  });
}

async function getFailedShareCardImageUrls(target: HTMLElement) {
  const imageUrls = getShareCardBackgroundImageUrls(target);

  if (imageUrls.length === 0) {
    return [];
  }

  const results = await Promise.all(imageUrls.map(preloadImageUrl));

  return results
    .filter((result) => !result.didLoad)
    .map((result) => result.url);
}

function removeFailedBackgroundUrls(
  backgroundImage: string,
  failedUrls: string[],
) {
  return failedUrls.reduce((currentValue, failedUrl) => {
    const escapedUrl = failedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const quotedUrlPattern = new RegExp(
      `url\\((['"]?)${escapedUrl}\\1\\)`,
      "g",
    );

    return currentValue.replace(quotedUrlPattern, "none");
  }, backgroundImage);
}

function temporarilyDisableFailedBackgroundImages(
  target: HTMLElement,
  failedUrls: string[],
) {
  if (failedUrls.length === 0) {
    return () => {};
  }

  const restoreCallbacks: Array<() => void> = [];
  const elements = [target, ...Array.from(target.querySelectorAll("*"))];

  elements.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const inlineBackgroundImage = element.style.backgroundImage;

    if (!inlineBackgroundImage) {
      return;
    }

    const nextBackgroundImage = removeFailedBackgroundUrls(
      inlineBackgroundImage,
      failedUrls,
    );

    if (nextBackgroundImage === inlineBackgroundImage) {
      return;
    }

    element.style.backgroundImage = nextBackgroundImage;
    restoreCallbacks.push(() => {
      element.style.backgroundImage = inlineBackgroundImage;
    });
  });

  return () => {
    restoreCallbacks.forEach((restore) => restore());
  };
}

async function blobFromDataUrl(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function createShareCardBlob(target: HTMLElement) {
  const exportOptions = {
    cacheBust: true,
    pixelRatio: shareCardExportPixelRatio,
    width: shareCardExportWidth,
    height: shareCardExportHeight,
    canvasWidth: shareCardExportWidth,
    canvasHeight: shareCardExportHeight,
    backgroundColor: "#12100f",
    imagePlaceholder: transparentImagePlaceholder,
  };

  const blob = await toBlob(target, exportOptions);

  if (blob && blob.size >= minimumShareCardBlobSize) {
    return blob;
  }

  const dataUrl = await toPng(target, exportOptions);
  const fallbackBlob = await blobFromDataUrl(dataUrl);

  if (!fallbackBlob || fallbackBlob.size < minimumShareCardBlobSize) {
    throw new Error(
      `Share card image blob was suspiciously small: ${fallbackBlob?.size ?? 0}`,
    );
  }

  return fallbackBlob;
}

export function MyArchive() {
  const router = useRouter();
  const shareCardExportRef = useRef<HTMLDivElement | null>(null);
  const isSupabaseConfigured = hasSupabaseConfig();
  const [impressions, setImpressions] = useState<ImpressionView[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [errorMessage, setErrorMessage] = useState(
    isSupabaseConfigured ? "" : missingSupabaseEnvMessage,
  );
  const [deletingImpressionId, setDeletingImpressionId] = useState<
    string | null
  >(null);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameErrorMessage, setNicknameErrorMessage] = useState("");
  const [nicknameSuccessMessage, setNicknameSuccessMessage] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [userEmailPrefix, setUserEmailPrefix] = useState("");
  const [sharePreviewImpression, setSharePreviewImpression] =
    useState<ImpressionView | null>(null);
  const [selectedShareCardLayout, setSelectedShareCardLayout] =
    useState<ImpressionShareCardLayout>("poster");
  const [isExportingShareCard, setIsExportingShareCard] = useState(false);
  const [shareExportErrorMessage, setShareExportErrorMessage] = useState("");
  const [shareExportHelpMessage, setShareExportHelpMessage] = useState("");
  const [shareExportFallbackUrl, setShareExportFallbackUrl] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function loadMyImpressions() {
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

      setUserEmailPrefix(userData.user.email?.split("@")[0]?.trim() ?? "");

      const [impressionsResult, profileResult] = await Promise.all([
        supabase
          .from("impressions")
          .select(
            `
            id,
            one_line,
            memorable_scene,
            personal_sentence,
            note,
            rating,
            watched_at,
            watch_method,
            created_at,
            movies (
              id,
              title,
              slug,
              poster_url,
              release_date
            ),
            impression_emotions (
              emotions (
                id,
                name,
                emoji
              )
            )
          `,
          )
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("display_name, nickname")
          .eq("id", userData.user.id)
          .maybeSingle(),
      ]);

      if (!isMounted) {
        return;
      }

      if (impressionsResult.error) {
        console.error(
          "Supabase my impressions load failed",
          impressionsResult.error,
        );
        setErrorMessage(
          `나의 감상을 불러오지 못했어요. ${impressionsResult.error.message}`,
        );
        setIsLoading(false);
        return;
      }

      if (profileResult.error) {
        console.error(
          "Supabase profile display name load failed",
          profileResult.error,
        );
      }

      setImpressions(
        ((impressionsResult.data ?? []) as SupabaseImpressionRow[]).map(
          normalizeImpression,
        ),
      );
      const profile = profileResult.data as SupabaseProfileRow | null;
      const nickname = (profile?.nickname ?? "").trim();

      setProfileDisplayName((profile?.display_name ?? "").trim());
      setProfileNickname(nickname);
      setNicknameInput(nickname);
      setIsLoading(false);
    }

    loadMyImpressions();

    return () => {
      isMounted = false;
    };
  }, [isSupabaseConfigured, router]);

  useEffect(() => {
    return () => {
      if (shareExportFallbackUrl) {
        URL.revokeObjectURL(shareExportFallbackUrl);
      }
    };
  }, [shareExportFallbackUrl]);

  async function handleDeleteImpression(impressionId: string) {
    const confirmed = window.confirm(
      "이 감상을 삭제할까요? 삭제한 감상은 되돌릴 수 없어요.",
    );

    if (!confirmed) {
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    setErrorMessage("");
    setDeletingImpressionId(impressionId);

    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Supabase getUser failed before deleting impression",
        userError,
      );
    }

    if (!userData.user) {
      setDeletingImpressionId(null);
      router.replace(getLoginPath());
      return;
    }

    const { error } = await supabase
      .from("impressions")
      .delete()
      .eq("id", impressionId)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Supabase impression delete failed", error);
      setErrorMessage(`감상을 삭제하지 못했어요. ${error.message}`);
      setDeletingImpressionId(null);
      return;
    }

    setImpressions((current) =>
      current.filter((impression) => impression.id !== impressionId),
    );
    setSharePreviewImpression((current) =>
      current?.id === impressionId ? null : current,
    );
    setDeletingImpressionId(null);
  }

  async function handleSaveNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNickname = nicknameInput.trim();

    setNicknameErrorMessage("");
    setNicknameSuccessMessage("");

    if (trimmedNickname && trimmedNickname.length < 2) {
      setNicknameErrorMessage("닉네임은 2자 이상 입력해주세요.");
      return;
    }

    if (trimmedNickname.length > 20) {
      setNicknameErrorMessage("닉네임은 20자 이하로 입력해주세요.");
      return;
    }

    if (!isSupabaseConfigured) {
      setNicknameErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    setIsSavingNickname(true);

    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase getUser failed before nickname save", userError);
    }

    if (!userData.user) {
      setIsSavingNickname(false);
      router.replace(getLoginPath());
      return;
    }

    const safeDisplayName = getShareCardAuthorName(
      "",
      profileDisplayName,
      userEmailPrefix,
    );

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userData.user.id,
          display_name: safeDisplayName,
          nickname: trimmedNickname || null,
        },
        { onConflict: "id" },
      );

    if (error) {
      console.error("Supabase nickname update failed", error);
      setNicknameErrorMessage(`닉네임을 저장하지 못했어요. ${error.message}`);
      setIsSavingNickname(false);
      return;
    }

    setProfileDisplayName(safeDisplayName);
    setProfileNickname(trimmedNickname);
    setNicknameInput(trimmedNickname);
    setNicknameSuccessMessage(
      trimmedNickname
        ? "닉네임이 저장됐어요."
        : "닉네임을 비워두었어요.",
    );
    setIsSavingNickname(false);
  }

  function openSharePreview(impression: ImpressionView) {
    setShareExportErrorMessage("");
    setShareExportHelpMessage("");
    setShareExportFallbackUrl("");
    setSelectedShareCardLayout("poster");
    setSharePreviewImpression(impression);
  }

  function closeSharePreview() {
    setShareExportErrorMessage("");
    setShareExportHelpMessage("");
    setShareExportFallbackUrl("");
    setSharePreviewImpression(null);
  }

  async function handleExportShareCard() {
    if (
      !sharePreviewImpression ||
      !shareCardExportRef.current ||
      isExportingShareCard
    ) {
      return;
    }

    setIsExportingShareCard(true);
    setShareExportErrorMessage("");
    setShareExportHelpMessage("");
    setShareExportFallbackUrl("");

    try {
      const exportTarget = shareCardExportRef.current;

      if (process.env.NODE_ENV === "development") {
        const rect = exportTarget.getBoundingClientRect();

        console.info("Share card export target", {
          layout: selectedShareCardLayout,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          childCount: exportTarget.childElementCount,
        });
      }

      const failedImageUrls = await getFailedShareCardImageUrls(exportTarget);
      const restoreBackgroundImages =
        temporarilyDisableFailedBackgroundImages(
          exportTarget,
          failedImageUrls,
        );

      const blob = await createShareCardBlob(exportTarget).finally(
        restoreBackgroundImages,
      );
      const objectUrl = URL.createObjectURL(blob);
      const fileName = getSafeDownloadFileName(
        sharePreviewImpression.movie.title,
      );

      try {
        downloadObjectUrl(objectUrl, fileName);
      } catch (downloadError) {
        console.error("Share card download click failed", downloadError);
      }

      setShareExportFallbackUrl(objectUrl);
      setShareExportHelpMessage(
        "저장이 잘 안 되면 이미지 열기를 눌러 열린 이미지를 길게 눌러 저장해주세요.",
      );
    } catch (error) {
      console.error("Share card PNG export failed", error);
      setShareExportErrorMessage("이미지를 저장하는 중 문제가 생겼어요.");
    } finally {
      setIsExportingShareCard(false);
    }
  }

  const hasImpressions = impressions.length > 0;
  const mostUsedEmotion = getMostUsedEmotion(impressions);
  const recentImpression = impressions[0];
  const recentEmotions = getRecentEmotions(impressions);
  const sharePreviewReleaseYear = getReleaseYear(
    sharePreviewImpression?.movie.releaseDate ?? null,
  );
  const sharePreviewWatchedDate = sharePreviewImpression
    ? formatDate(sharePreviewImpression.watchedAt)
    : null;
  const sharePreviewWatchMethodLabel = sharePreviewImpression
    ? getWatchMethodLabel(sharePreviewImpression.watchMethod)
    : null;
  const sharePreviewQuote =
    sharePreviewImpression?.personalSentence?.trim() ||
    sharePreviewImpression?.oneLine ||
    "";
  const sharePreviewAuthorName = getShareCardAuthorName(
    profileNickname,
    profileDisplayName,
    userEmailPrefix,
  );

  const summaryItems = [
    {
      label: "총 감상 수",
      value: `${impressions.length.toLocaleString("ko-KR")}개`,
      description: "직접 남긴 마음의 기록",
    },
    {
      label: "가장 많이 남은 감정",
      value: mostUsedEmotion ? getEmotionLabel(mostUsedEmotion) : "아직 없음",
      description: "지금까지 가장 자주 고른 감정",
      emotion: mostUsedEmotion,
    },
    {
      label: "최근 남긴 날짜",
      value: formatDate(recentImpression?.createdAt ?? null) ?? "아직 없음",
      description: recentImpression
        ? `${recentImpression.movie.title}에 남긴 감상`
        : "첫 감상을 기다리고 있어요.",
    },
    {
      label: "최근 감정",
      value: recentEmotions[0]
        ? getEmotionLabel(recentEmotions[0].emotion)
        : "아직 없음",
      description: recentEmotions[0]
        ? `${recentEmotions[0].movieTitle}에서 남은 마음`
        : "최근 감정이 아직 없어요.",
      emotion: recentEmotions[0]?.emotion,
    },
  ];

  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-end">
          <SectionHeader
            eyebrow="개인 아카이브"
            title="나의 여운"
            description="내가 본 영화들이 어떤 감정으로 남았는지 모아보세요."
            titleAs="h1"
          />

          <Card className="bg-[linear-gradient(145deg,rgba(240,161,95,0.16),rgba(244,199,216,0.08)_52%,rgba(255,247,234,0.06))]">
            <p className="text-sm font-medium text-[#f2b482]">
              오늘 다시 꺼내 본 감정
            </p>
            <p className="mt-4 text-2xl font-semibold leading-9 text-[#fff7ea]">
              감상은 짧아도, 마음에 남은 장면은 오래 머물러요.
            </p>
          </Card>
        </div>

        {isLoading ? (
          <Card className="mt-12 p-6">
            <p className="text-sm font-medium text-[#f2b482]">
              감상을 불러오는 중
            </p>
            <p className="mt-3 text-xl font-semibold leading-8 text-[#fff7ea]">
              저장해 둔 여운을 조용히 꺼내고 있어요.
            </p>
          </Card>
        ) : null}

        {errorMessage ? (
          <Card className="mt-12 border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-6">
            <p className="text-sm font-medium text-[#f4c7d8]">
              불러오기 오류
            </p>
            <p className="mt-3 text-base leading-7 text-[#f4c7d8]">
              {errorMessage}
            </p>
          </Card>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
            <Card className="mt-12 p-5">
              <form
                className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
                onSubmit={handleSaveNickname}
              >
                <div className="max-w-xl">
                  <label
                    htmlFor="profile-nickname"
                    className="text-sm font-medium text-[#f2b482]"
                  >
                    닉네임
                  </label>
                  <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                    공유 카드에 표시될 이름이에요. 비워두면 여운 사용자로
                    보여드려요.
                  </p>
                  <p className="mt-2 text-sm text-[#e7d4c0]">
                    현재 표시 이름:{" "}
                    <span className="font-semibold text-[#fff7ea]">
                      {sharePreviewAuthorName}
                    </span>
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row">
                  <input
                    id="profile-nickname"
                    value={nicknameInput}
                    onChange={(event) => {
                      setNicknameInput(event.target.value);
                      setNicknameErrorMessage("");
                      setNicknameSuccessMessage("");
                    }}
                    placeholder="공유 카드에 표시될 이름"
                    className="min-h-11 flex-1 rounded-full border border-[#fff7ea]/12 bg-[#12100f] px-4 py-2 text-sm text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
                  />
                  <Button
                    type="submit"
                    disabled={isSavingNickname}
                    className="min-h-11 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingNickname ? "저장 중" : "닉네임 저장"}
                  </Button>
                </div>
              </form>

              {nicknameErrorMessage ? (
                <p className="mt-4 rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm leading-6 text-[#f4c7d8]">
                  {nicknameErrorMessage}
                </p>
              ) : null}

              {nicknameSuccessMessage ? (
                <p className="mt-4 rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 px-4 py-3 text-sm leading-6 text-[#ffd3a3]">
                  {nicknameSuccessMessage}
                </p>
              ) : null}
            </Card>

            <section
              className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="나의 감상 요약"
            >
              {summaryItems.map((item) => (
                <Card key={item.label} className="p-5">
                  <p className="text-sm font-medium text-[#c9ad96]">
                    {item.label}
                  </p>
                  <div className="mt-4">
                    {item.emotion ? (
                      <EmotionTag
                        as="span"
                        tone={getEmotionTone(item.emotion.name)}
                      >
                        {item.value}
                      </EmotionTag>
                    ) : (
                      <p className="text-3xl font-semibold text-[#fff7ea]">
                        {item.value}
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#c9ad96]">
                    {item.description}
                  </p>
                </Card>
              ))}
            </section>

            {hasImpressions ? (
              <>
                <section className="mt-16" aria-labelledby="my-impression-list">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2
                        id="my-impression-list"
                        className="text-2xl font-semibold text-[#fff7ea]"
                      >
                        내가 남긴 감상
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                        영화마다 남겨둔 감정과 한 줄을 천천히 다시 볼 수
                        있어요.
                      </p>
                    </div>
                    <ButtonLink href="/impressions/new">
                      감상 더 남기기
                    </ButtonLink>
                  </div>

                  <div className="mt-8 space-y-5">
                    {impressions.map((impression) => {
                      const releaseYear = getReleaseYear(
                        impression.movie.releaseDate,
                      );
                      const watchedDate = formatDate(impression.watchedAt);
                      const createdDate = formatDate(impression.createdAt);
                      const watchMethodLabel = getWatchMethodLabel(
                        impression.watchMethod,
                      );

                      return (
                        <Card
                          key={impression.id}
                          className="overflow-hidden p-0"
                        >
                          <article className="grid md:grid-cols-[168px_minmax(0,1fr)]">
                            <div
                              className="border-b border-[#fff7ea]/10 bg-[linear-gradient(145deg,rgba(240,161,95,0.2),rgba(244,199,216,0.1)_48%,rgba(18,16,15,0.88))] bg-cover bg-center p-4 md:border-b-0 md:border-r"
                              style={
                                impression.movie.posterUrl
                                  ? {
                                      backgroundImage: `linear-gradient(180deg,rgba(18,16,15,0.1),rgba(18,16,15,0.84)),url(${impression.movie.posterUrl})`,
                                    }
                                  : undefined
                              }
                            >
                              <div className="aspect-[2/3] rounded-md border border-[#fff7ea]/10 bg-[#12100f]/34 p-4 backdrop-blur-[1px]">
                                <div className="flex h-full flex-col justify-between">
                                  <p className="text-xs font-medium text-[#f2b482]">
                                    남은 장면
                                  </p>
                                  <div>
                                    <p className="text-2xl font-semibold leading-tight text-[#fff7ea]">
                                      {impression.movie.title}
                                    </p>
                                    {releaseYear ? (
                                      <p className="mt-2 text-sm text-[#e7d4c0]">
                                        {releaseYear}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 sm:p-6">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  {watchedDate ? (
                                    <p className="text-sm text-[#c9ad96]">
                                      {watchedDate}
                                    </p>
                                  ) : null}
                                  <h3 className="mt-2 text-2xl font-semibold text-[#fff7ea]">
                                    {impression.movie.title}
                                  </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {impression.emotions.map((emotion) => (
                                    <EmotionTag
                                      as="span"
                                      key={emotion.id}
                                      tone={getEmotionTone(emotion.name)}
                                    >
                                      {getEmotionLabel(emotion)}
                                    </EmotionTag>
                                  ))}
                                </div>
                              </div>

                              <p className="mt-6 text-xl leading-8 text-[#fff7ea]">
                                “{impression.oneLine}”
                              </p>

                              {impression.memorableScene ||
                              impression.personalSentence ? (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  {impression.memorableScene ? (
                                    <div className="rounded-lg border border-[#fff7ea]/8 bg-[#fff7ea]/5 p-4">
                                      <p className="text-xs font-semibold text-[#f2b482]">
                                        인상 깊었던 장면
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-[#e7d4c0]">
                                        {getNotePreview(
                                          impression.memorableScene,
                                        )}
                                      </p>
                                    </div>
                                  ) : null}
                                  {impression.personalSentence ? (
                                    <div className="rounded-lg border border-[#fff7ea]/8 bg-[#fff7ea]/5 p-4">
                                      <p className="text-xs font-semibold text-[#f2b482]">
                                        오늘의 문장
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-[#e7d4c0]">
                                        {getNotePreview(
                                          impression.personalSentence,
                                        )}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}

                              {impression.note ? (
                                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#e7d4c0]">
                                  {getNotePreview(impression.note)}
                                </p>
                              ) : null}

                              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap gap-3 text-sm text-[#c9ad96]">
                                  {watchedDate ? (
                                    <span>본 날짜 {watchedDate}</span>
                                  ) : null}
                                  {!watchedDate && createdDate ? (
                                    <span>남긴 날짜 {createdDate}</span>
                                  ) : null}
                                  {impression.rating ? (
                                    <span>별점 {impression.rating}</span>
                                  ) : null}
                                  {watchMethodLabel ? (
                                    <span>시청 방법: {watchMethodLabel}</span>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => openSharePreview(impression)}
                                    className="min-h-10 px-4 py-2 text-sm"
                                  >
                                    공유 카드
                                  </Button>
                                  <ButtonLink
                                    href={`/impressions/${impression.id}/edit`}
                                    variant="secondary"
                                    className="px-4 py-2 text-sm"
                                  >
                                    수정
                                  </ButtonLink>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={
                                      deletingImpressionId === impression.id
                                    }
                                    onClick={() =>
                                      void handleDeleteImpression(impression.id)
                                    }
                                    className="min-h-10 px-4 py-2 text-sm text-[#f4c7d8] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {deletingImpressionId === impression.id
                                      ? "삭제 중"
                                      : "삭제"}
                                  </Button>
                                  {impression.movie.id ? (
                                    <ButtonLink
                                      href={getMovieHref(impression.movie)}
                                      variant="secondary"
                                      className="px-4 py-2 text-sm"
                                    >
                                      영화 다시 보기
                                    </ButtonLink>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </article>
                        </Card>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-16" aria-labelledby="mood-archive">
                  <Card className="bg-[linear-gradient(145deg,rgba(255,247,234,0.07),rgba(240,161,95,0.12)_48%,rgba(200,182,255,0.08))] p-6 sm:p-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)] lg:items-start">
                      <div>
                        <p className="text-sm font-medium text-[#f2b482]">
                          무드 아카이브
                        </p>
                        <h2
                          id="mood-archive"
                          className="mt-3 text-3xl font-semibold leading-tight text-[#fff7ea]"
                        >
                          최근 감정의 조각들
                        </h2>
                        <p className="mt-4 text-base leading-7 text-[#c9ad96]">
                          날짜와 영화 제목 옆에 남은 감정을 작게 모아두었어요.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {recentEmotions.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/36 p-4"
                          >
                            <EmotionTag
                              as="span"
                              tone={getEmotionTone(item.emotion.name)}
                            >
                              {getEmotionLabel(item.emotion)}
                            </EmotionTag>
                            <p className="mt-4 font-semibold text-[#fff7ea]">
                              {item.movieTitle}
                            </p>
                            {item.date ? (
                              <p className="mt-1 text-sm text-[#c9ad96]">
                                {formatDate(item.date)}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </section>
              </>
            ) : (
              <Card className="mt-16 border-dashed bg-[#fff7ea]/5 p-8 text-center">
                <p className="text-2xl font-semibold text-[#fff7ea]">
                  아직 남긴 감상이 없어요.
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c9ad96]">
                  첫 영화를 기록하면 이곳에 당신만의 여운이 쌓여요.
                </p>
                <ButtonLink href="/impressions/new" className="mt-7">
                  첫 감상 남기기
                </ButtonLink>
              </Card>
            )}
          </>
        ) : null}
      </PageContainer>

      {sharePreviewImpression ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-card-preview-title"
          className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#050403]/82 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-6"
        >
          <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-5xl items-start justify-center pb-8 sm:min-h-[calc(100dvh-3rem)] sm:items-center sm:pb-0">
            <Card className="max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto overflow-x-hidden border-[#fff7ea]/14 bg-[#171311] p-4 shadow-[0_34px_120px_rgba(0,0,0,0.58)] sm:max-h-[calc(100dvh-3rem)] sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    id="share-card-layout-label"
                    className="text-sm font-medium text-[#f2b482]"
                  >
                    카드 레이아웃
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#c9ad96]">
                    감상의 분위기에 맞는 카드 모양을 골라보세요.
                  </p>
                </div>
                <div
                  role="radiogroup"
                  aria-labelledby="share-card-layout-label"
                  className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-[#fff7ea]/12 bg-[#0d0a09]/70 p-1 sm:w-auto sm:min-w-[440px] sm:grid-cols-5 sm:rounded-full"
                >
                  {shareCardLayoutOptions.map((option) => {
                    const isSelected = option.id === selectedShareCardLayout;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedShareCardLayout(option.id)}
                        className={`min-h-9 rounded-full px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#ffd3a3]/40 ${
                          isSelected
                            ? "bg-[#ffd3a3] text-[#1f1208] shadow-[0_10px_28px_rgba(240,161,95,0.22)]"
                            : "text-[#e7d4c0] hover:bg-[#fff7ea]/8 hover:text-[#fff7ea]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(240px,360px)_minmax(0,1fr)] lg:items-center">
                <div className="mx-auto flex w-full justify-center overflow-visible py-1">
                  <div className="w-full max-w-[300px] sm:max-w-[360px]">
                    <ImpressionShareCard
                      layout={selectedShareCardLayout}
                      movieTitle={sharePreviewImpression.movie.title}
                      releaseYear={sharePreviewReleaseYear}
                      posterUrl={sharePreviewImpression.movie.posterUrl}
                      emotions={sharePreviewImpression.emotions}
                      quote={sharePreviewQuote}
                      rating={sharePreviewImpression.rating}
                      watchedDate={sharePreviewWatchedDate}
                      watchMethodLabel={sharePreviewWatchMethodLabel}
                      authorName={sharePreviewAuthorName}
                    />
                  </div>
                </div>

                <div className="lg:pl-2">
                  <p className="text-sm font-medium text-[#f2b482]">
                    공유 카드 미리보기
                  </p>
                  <h2
                    id="share-card-preview-title"
                    className="mt-3 text-2xl font-semibold leading-tight text-[#fff7ea]"
                  >
                    {sharePreviewImpression.movie.title}의 여운을 카드로
                    담았어요.
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-[#c9ad96]">
                    저장한 이미지는 인스타 스토리나 게시글에 공유해보세요.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#e7d4c0]">
                    카드만 PNG로 저장돼요. 화면 전체나 버튼은 이미지에
                    포함되지 않아요.
                  </p>

                  {shareExportErrorMessage ? (
                    <p className="mt-4 rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm leading-6 text-[#f4c7d8]">
                      {shareExportErrorMessage}
                    </p>
                  ) : null}

                  {shareExportHelpMessage ? (
                    <p className="mt-4 rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 px-4 py-3 text-sm leading-6 text-[#ffd3a3]">
                      {shareExportHelpMessage}
                      {shareExportFallbackUrl ? (
                        <>
                          {" "}
                          <a
                            href={shareExportFallbackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline decoration-[#ffd3a3]/50 underline-offset-4"
                          >
                            이미지 열기
                          </a>
                        </>
                      ) : null}
                    </p>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      disabled={isExportingShareCard}
                      onClick={() => void handleExportShareCard()}
                      className="disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isExportingShareCard
                        ? "이미지를 만드는 중이에요..."
                        : "이미지로 저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeSharePreview}
                    >
                      닫기
                    </Button>
                    <ButtonLink
                      href={`/impressions/${sharePreviewImpression.id}/edit`}
                      variant="secondary"
                    >
                      감상 다듬기
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {sharePreviewImpression ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-10000px] top-0 h-[640px] w-[360px] overflow-visible bg-[#12100f] opacity-100"
        >
          <ImpressionShareCard
            ref={shareCardExportRef}
            layout={selectedShareCardLayout}
            movieTitle={sharePreviewImpression.movie.title}
            releaseYear={sharePreviewReleaseYear}
            posterUrl={sharePreviewImpression.movie.posterUrl}
            emotions={sharePreviewImpression.emotions}
            quote={sharePreviewQuote}
            rating={sharePreviewImpression.rating}
            watchedDate={sharePreviewWatchedDate}
            watchMethodLabel={sharePreviewWatchMethodLabel}
            authorName={sharePreviewAuthorName}
          />
        </div>
      ) : null}
    </main>
  );
}
