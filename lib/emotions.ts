export type EmotionTone = "warm" | "rose" | "violet";

export type EmotionOption = {
  label: string;
  tone: EmotionTone;
};

export const emotionOptions = [
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
] satisfies EmotionOption[];

const emotionToneByName = new Map(
  emotionOptions.map((emotion) => [emotion.label, emotion.tone]),
);

export function getEmotionTone(emotionName: string): EmotionTone {
  return emotionToneByName.get(emotionName) ?? "warm";
}
