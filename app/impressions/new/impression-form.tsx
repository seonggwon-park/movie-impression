"use client";

import { FormEvent, useState } from "react";
import { Button, Card, EmotionTag } from "@/components/ui";
import {
  type EmotionTone,
  placeholderMovies,
} from "@/lib/placeholder-data";

type EmotionChoice = {
  label: string;
  tone: EmotionTone;
};

const emotionChoices = [
  { label: "먹먹함", tone: "warm" },
  { label: "설렘", tone: "rose" },
  { label: "위로됨", tone: "violet" },
  { label: "통쾌함", tone: "warm" },
  { label: "찝찝함", tone: "violet" },
  { label: "무서움", tone: "violet" },
  { label: "혼란스러움", tone: "violet" },
  { label: "따뜻함", tone: "warm" },
  { label: "슬픔", tone: "rose" },
  { label: "웃김", tone: "warm" },
  { label: "압도됨", tone: "rose" },
  { label: "여운 남음", tone: "warm" },
] satisfies EmotionChoice[];

export function ImpressionForm() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  function toggleEmotion(emotion: string) {
    setSuccessMessage("");
    setSelectedEmotions((current) =>
      current.includes(emotion)
        ? current.filter((item) => item !== emotion)
        : [...current, emotion],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("좋아요. 이 감상이 저장될 준비가 되었어요.");
  }

  return (
    <Card className="mt-10 max-w-4xl p-6 sm:p-8">
      <form className="space-y-9" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="movie"
            className="text-sm font-medium text-[#f2b482]"
          >
            어떤 영화를 보셨나요?
          </label>
          <select
            id="movie"
            name="movie"
            defaultValue={placeholderMovies[0]?.id}
            className="mt-3 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-[#fff7ea] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          >
            {placeholderMovies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-[#f2b482]">
            마음에 남은 감정
          </legend>
          <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
            하나만 골라도, 여러 개를 골라도 괜찮아요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {emotionChoices.map((emotion) => (
              <EmotionTag
                key={emotion.label}
                selected={selectedEmotions.includes(emotion.label)}
                tone={emotion.tone}
                onClick={() => toggleEmotion(emotion.label)}
              >
                {emotion.label}
              </EmotionTag>
            ))}
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
            placeholder="영화가 끝나고 어떤 마음이 남았나요?"
            className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          />
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
              defaultValue=""
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

          <div>
            <label
              htmlFor="watched-date"
              className="text-sm font-medium text-[#c9ad96]"
            >
              본 날짜
            </label>
            <input
              id="watched-date"
              name="watchedDate"
              type="date"
              className="mt-3 w-full rounded-lg border border-[#fff7ea]/10 bg-[#12100f] px-4 py-3 text-[#e7d4c0] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 px-4 py-3 text-sm leading-6 text-[#e7d4c0]">
          <input
            name="hasSpoiler"
            type="checkbox"
            className="h-4 w-4 accent-[#f0a15f]"
          />
          스포일러가 포함되어 있어요
        </label>

        {successMessage ? (
          <p className="rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 px-4 py-3 text-sm font-medium text-[#ffd3a3]">
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit">감상 남기기</Button>
          <p className="text-sm leading-6 text-[#c9ad96]">
            아직 저장되지는 않아요. 지금은 감상을 남기는 흐름만 확인할 수
            있어요.
          </p>
        </div>
      </form>
    </Card>
  );
}
