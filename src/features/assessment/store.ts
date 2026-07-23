import { ASSESSMENT_QUESTIONS } from "@/features/assessment/questions";
import { countCorrect, scoreAssessment } from "@/features/assessment/score";
import type { AssessmentAnswers, AssessmentAttempt } from "@/features/assessment/types";
import { getZiGengDb } from "@/lib/offline/db";

function newId(): string {
  return crypto.randomUUID();
}

export async function saveAssessmentAttempt(
  userId: string,
  answers: AssessmentAnswers,
): Promise<AssessmentAttempt> {
  const profile = scoreAssessment(answers);
  const attempt: AssessmentAttempt = {
    id: newId(),
    userId,
    answers,
    profile,
    completedAt: new Date().toISOString(),
    questionCount: ASSESSMENT_QUESTIONS.length,
    correctCount: countCorrect(answers),
  };
  const db = getZiGengDb();
  await db.assessmentAttempts.put(attempt);
  return attempt;
}

export async function latestAssessmentAttempt(userId: string): Promise<AssessmentAttempt | null> {
  const db = getZiGengDb();
  const rows = await db.assessmentAttempts.where("userId").equals(userId).toArray();
  if (!rows.length) return null;
  rows.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  return rows[0] ?? null;
}

export async function listAssessmentAttempts(userId: string): Promise<AssessmentAttempt[]> {
  const db = getZiGengDb();
  const rows = await db.assessmentAttempts.where("userId").equals(userId).toArray();
  return rows.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
