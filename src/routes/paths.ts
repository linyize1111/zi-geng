export const routes = {
  login: "/login",
  unauthorized: "/unauthorized",
  onboarding: "/onboarding",
  today: "/today",
  learn: "/learn",
  learnVocabulary: "/learn/vocabulary",
  learnVocabularyDetail: "/learn/vocabulary/:id",
  learnQuotes: "/learn/quotes",
  learnQuotesDetail: "/learn/quotes/:id",
  learnCraft: "/learn/craft",
  learnCraftDetail: "/learn/craft/:id",
  write: "/write",
  writeNew: "/write/new",
  writeDetail: "/write/:id",
  novels: "/novels",
  novelsNew: "/novels/new",
  novelsDetail: "/novels/:projectId",
  novelsCharacters: "/novels/:projectId/characters",
  novelsChapters: "/novels/:projectId/chapters",
  novelsScenes: "/novels/:projectId/scenes",
  japanese: "/japanese",
  japaneseKana: "/japanese/kana",
  japaneseVocabulary: "/japanese/vocabulary",
  japaneseGrammar: "/japanese/grammar",
  review: "/review",
  favorites: "/favorites",
  settings: "/settings",
  ownerContent: "/owner/content",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export function writeDetailPath(id: string): string {
  return `/write/${id}`;
}

export function novelDetailPath(id: string): string {
  return `/novels/${id}`;
}
