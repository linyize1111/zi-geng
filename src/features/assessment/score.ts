import { ASSESSMENT_QUESTIONS } from "@/features/assessment/questions";
import {
  BAND_LABELS,
  type AssessmentAnswers,
  type AssessmentBand,
  type AssessmentProfile,
  type BandScore,
} from "@/features/assessment/types";

function levelFor(percent: number): BandScore["level"] {
  if (percent >= 85) return "洗練";
  if (percent >= 70) return "進階";
  if (percent >= 50) return "穩固";
  return "起步";
}

export function scoreAssessment(answers: AssessmentAnswers): AssessmentProfile {
  const bands: AssessmentBand[] = ["vocab", "classical", "critique", "scene"];
  const bandScores: BandScore[] = bands.map((band) => {
    const qs = ASSESSMENT_QUESTIONS.filter((q) => q.band === band);
    let correct = 0;
    for (const q of qs) {
      if (answers[q.id] === q.answer) correct += 1;
    }
    const total = qs.length;
    const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
    return {
      band,
      label: BAND_LABELS[band],
      correct,
      total,
      percent,
      level: levelFor(percent),
    };
  });

  const correctCount = ASSESSMENT_QUESTIONS.filter((q) => answers[q.id] === q.answer).length;
  const overallPercent = Math.round((correctCount / ASSESSMENT_QUESTIONS.length) * 100);

  const guidance: string[] = [];
  const sorted = [...bandScores].sort((a, b) => a.percent - b.percent);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  if (weakest && weakest.percent < 70) {
    if (weakest.band === "vocab") {
      guidance.push("詞彙精準偏弱：優先刷「對照／文言語感」詞卡，少用很X、漂亮級空詞。");
    } else if (weakest.band === "classical") {
      guidance.push("古典素養可加強：名言卡先看哲學／論孟老莊與出處，再讀短析。");
    } else if (weakest.band === "critique") {
      guidance.push("評論用語可練：寫作技巧卡著重修辭辨異與強弱例。");
    } else {
      guidance.push("場面描寫可練：每日短寫用動作／感官改寫一句情緒標籤。");
    }
  }
  if (strongest && strongest.percent >= 80) {
    guidance.push(`相對強項是「${strongest.label}」：可把難度調高，多碰哲學箴言與進階詞。`);
  }
  if (overallPercent >= 80) {
    guidance.push("整體已偏進階：內容以文采詞與議論名句為主即可。");
  } else if (overallPercent < 55) {
    guidance.push("建議先穩固基礎：每天少量詞彙＋一則名言短析，再回頭重測。");
  } else {
    guidance.push("中段水準：保持每日節奏，弱項多練兩週後重測一次。");
  }

  return { overallPercent, bands: bandScores, guidance };
}

export function countCorrect(answers: AssessmentAnswers): number {
  return ASSESSMENT_QUESTIONS.filter((q) => answers[q.id] === q.answer).length;
}
