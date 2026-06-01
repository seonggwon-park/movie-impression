"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, PageContainer, SectionHeader } from "@/components/ui";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";

type MaybeArray<T> = T | T[] | null;

type ReportStatus = "pending" | "reviewed" | "dismissed" | "action_taken";

type ReportReason =
  | "offensive"
  | "sexual"
  | "violence_crime"
  | "hate_discrimination"
  | "spoiler"
  | "spam"
  | "other";

type AdminReportMovie = {
  id: string;
  title: string;
  slug: string | null;
};

type AdminReportImpression = {
  id: string;
  one_line: string;
  note: string | null;
  created_at: string | null;
  movies: MaybeArray<AdminReportMovie>;
};

type AdminReport = {
  id: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  created_at: string | null;
  impressions: MaybeArray<AdminReportImpression>;
};

type AdminReportsResponse = {
  reports?: AdminReport[];
  message?: string;
};

const reasonLabels: Record<ReportReason, string> = {
  offensive: "불쾌한 표현",
  sexual: "성적 콘텐츠",
  violence_crime: "폭력/범죄 관련",
  hate_discrimination: "혐오/차별 표현",
  spoiler: "스포일러",
  spam: "스팸/광고",
  other: "기타",
};

const statusLabels: Record<ReportStatus, string> = {
  pending: "대기",
  reviewed: "검토 완료",
  dismissed: "기각",
  action_taken: "조치 완료",
};

const statusOrder: Record<ReportStatus, number> = {
  pending: 0,
  reviewed: 1,
  dismissed: 2,
  action_taken: 3,
};

function getSingleRelation<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getReportImpression(report: AdminReport) {
  return getSingleRelation(report.impressions);
}

function getReportMovie(report: AdminReport) {
  return getSingleRelation(getReportImpression(report)?.movies ?? null);
}

function formatDate(value: string | null) {
  if (!value) {
    return "날짜 미상";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNotePreview(note: string) {
  return note.length > 160 ? `${note.slice(0, 160)}...` : note;
}

function getMovieHref(movie: AdminReportMovie) {
  return `/movies/${movie.slug || movie.id}`;
}

function sortReports(reports: AdminReport[]) {
  return [...reports].sort((a, b) => {
    const statusDifference = statusOrder[a.status] - statusOrder[b.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

    return bTime - aTime;
  });
}

export function AdminReportsClient() {
  const router = useRouter();
  const isSupabaseConfigured = hasSupabaseConfig();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isForbidden, setIsForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    isSupabaseConfigured
      ? ""
      : "Supabase 환경변수가 설정되지 않아 관리자 기능을 사용할 수 없어요.",
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [deletingImpressionId, setDeletingImpressionId] = useState<
    string | null
  >(null);

  async function getAccessToken() {
    if (!isSupabaseConfigured) {
      return null;
    }

    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return data.session?.access_token ?? null;
  }

  async function loadReports() {
    setErrorMessage("");
    setSuccessMessage("");

    const accessToken = await getAccessToken();

    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent("/admin/reports")}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/reports", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = (await response.json()) as AdminReportsResponse;

      if (response.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/admin/reports")}`);
        return;
      }

      if (response.status === 403) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "신고 목록을 불러오지 못했어요.");
      }

      setReports(data.reports ?? []);
      setIsForbidden(false);
    } catch (error) {
      console.error("Admin reports request failed", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "신고 목록을 불러오지 못했어요.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseConfigured]);

  async function updateReportStatus(reportId: string, status: ReportStatus) {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent("/admin/reports")}`);
      return;
    }

    setUpdatingReportId(reportId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as AdminReportsResponse;

      if (!response.ok) {
        throw new Error(data.message || "신고 상태를 바꾸지 못했어요.");
      }

      setReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, status } : report,
        ),
      );
      setSuccessMessage("신고 상태를 변경했어요.");
    } catch (error) {
      console.error("Admin report status request failed", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "신고 상태를 바꾸지 못했어요.",
      );
    } finally {
      setUpdatingReportId(null);
    }
  }

  async function deleteReportedImpression(report: AdminReport) {
    const impression = getReportImpression(report);

    if (!impression) {
      setErrorMessage("삭제할 감상을 찾지 못했어요.");
      return;
    }

    const confirmed = window.confirm(
      "이 감상을 삭제할까요? 삭제하면 되돌릴 수 없어요.",
    );

    if (!confirmed) {
      return;
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent("/admin/reports")}`);
      return;
    }

    setDeletingImpressionId(impression.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/impressions/${impression.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = (await response.json()) as AdminReportsResponse;

      if (!response.ok) {
        throw new Error(data.message || "감상을 삭제하지 못했어요.");
      }

      setReports((current) =>
        current.filter(
          (item) => getReportImpression(item)?.id !== impression.id,
        ),
      );
      setSuccessMessage("감상을 삭제하고 관련 신고를 조치 완료로 처리했어요.");
    } catch (error) {
      console.error("Admin impression delete request failed", error);
      setErrorMessage(
        error instanceof Error ? error.message : "감상을 삭제하지 못했어요.",
      );
    } finally {
      setDeletingImpressionId(null);
    }
  }

  const sortedReports = useMemo(() => sortReports(reports), [reports]);

  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <SectionHeader
          eyebrow="관리"
          title="신고 관리"
          description="접수된 신고를 확인하고 필요한 최소 조치만 진행해요."
          titleAs="h1"
        />

        {isForbidden ? (
          <Card className="mt-10 border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-6">
            <p className="text-xl font-semibold text-[#f4c7d8]">
              관리자만 접근할 수 있어요.
            </p>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="mt-10 p-6">
            <p className="text-sm font-medium text-[#f2b482]">
              신고를 불러오는 중
            </p>
            <p className="mt-3 text-xl font-semibold leading-8 text-[#fff7ea]">
              접수된 감상을 조용히 정리하고 있어요.
            </p>
          </Card>
        ) : null}

        {errorMessage && !isForbidden ? (
          <Card className="mt-10 border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-6">
            <p className="text-sm font-medium text-[#f4c7d8]">오류</p>
            <p className="mt-3 text-base leading-7 text-[#f4c7d8]">
              {errorMessage}
            </p>
          </Card>
        ) : null}

        {successMessage ? (
          <Card className="mt-10 border-[#f0a15f]/24 bg-[#f0a15f]/10 p-5">
            <p className="text-sm leading-6 text-[#ffd3a3]">
              {successMessage}
            </p>
          </Card>
        ) : null}

        {!isLoading && !isForbidden && !errorMessage ? (
          sortedReports.length > 0 ? (
            <section className="mt-10 space-y-5" aria-label="신고 목록">
              {sortedReports.map((report) => {
                const impression = getReportImpression(report);
                const movie = getReportMovie(report);
                const isUpdating = updatingReportId === report.id;
                const isDeleting =
                  Boolean(impression) &&
                  deletingImpressionId === impression?.id;

                return (
                  <Card key={report.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#f0a15f]/30 bg-[#f0a15f]/12 px-3 py-1 text-sm font-medium text-[#ffd3a3]">
                            {reasonLabels[report.reason] ?? "기타"}
                          </span>
                          <span className="rounded-full border border-[#fff7ea]/12 bg-[#fff7ea]/7 px-3 py-1 text-sm text-[#e7d4c0]">
                            {statusLabels[report.status] ?? report.status}
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[#c9ad96]">
                          접수 {formatDate(report.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isUpdating}
                          onClick={() =>
                            void updateReportStatus(report.id, "reviewed")
                          }
                          className="min-h-10 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          검토 완료
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isUpdating}
                          onClick={() =>
                            void updateReportStatus(report.id, "dismissed")
                          }
                          className="min-h-10 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          기각
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={!impression || isDeleting}
                          onClick={() => void deleteReportedImpression(report)}
                          className="min-h-10 px-4 py-2 text-sm text-[#f4c7d8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeleting ? "삭제 중" : "감상 삭제"}
                        </Button>
                      </div>
                    </div>

                    {report.detail ? (
                      <p className="mt-5 rounded-lg border border-[#fff7ea]/8 bg-[#fff7ea]/5 p-4 text-sm leading-6 text-[#e7d4c0]">
                        {report.detail}
                      </p>
                    ) : null}

                    <div className="mt-5 rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/38 p-4">
                      <p className="text-sm text-[#c9ad96]">
                        {movie ? (
                          <Link
                            href={getMovieHref(movie)}
                            className="text-[#f2b482] underline-offset-4 hover:underline"
                          >
                            {movie.title}
                          </Link>
                        ) : (
                          "영화 정보 없음"
                        )}
                      </p>
                      <p className="mt-3 text-lg leading-8 text-[#fff7ea]">
                        {impression?.one_line ?? "삭제되었거나 찾을 수 없는 감상"}
                      </p>
                      {impression?.note ? (
                        <p className="mt-3 text-sm leading-7 text-[#e7d4c0]">
                          {getNotePreview(impression.note)}
                        </p>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </section>
          ) : (
            <Card className="mt-10 border-dashed bg-[#fff7ea]/5 p-8 text-center">
              <p className="text-2xl font-semibold text-[#fff7ea]">
                접수된 신고가 없어요.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c9ad96]">
                새 신고가 들어오면 이곳에서 확인할 수 있어요.
              </p>
            </Card>
          )
        ) : null}
      </PageContainer>
    </main>
  );
}
