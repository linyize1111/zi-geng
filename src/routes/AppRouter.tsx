import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoading } from "@/components/common/PageState";
import { RequireMember, RequireOwner } from "@/features/auth/RequireAuth";
import { routes } from "@/routes/paths";

const TodayPage = lazy(() => import("@/pages/TodayPage"));
const LearnPage = lazy(() => import("@/pages/LearnPage"));
const LearnSectionPage = lazy(() => import("@/pages/LearnSectionPage"));
const WritePage = lazy(() => import("@/pages/WritePage"));
const WriteEditorPage = lazy(() => import("@/pages/WriteEditorPage"));
const NovelsPage = lazy(() => import("@/pages/NovelsPage"));
const NovelEditorPage = lazy(() => import("@/pages/NovelEditorPage"));
const NovelEntitiesPage = lazy(() => import("@/pages/NovelEntitiesPage"));
const JapanesePage = lazy(() => import("@/pages/JapanesePage"));
const ReviewPage = lazy(() => import("@/pages/ReviewPage"));
const FavoritesPage = lazy(() => import("@/pages/FavoritesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const OwnerContentPage = lazy(() => import("@/pages/OwnerContentPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function L({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path={routes.login}
        element={
          <L>
            <LoginPage />
          </L>
        }
      />
      <Route
        path={routes.unauthorized}
        element={
          <L>
            <UnauthorizedPage />
          </L>
        }
      />
      <Route
        path={routes.onboarding}
        element={
          <L>
            <OnboardingPage />
          </L>
        }
      />

      <Route
        element={
          <RequireMember>
            <AppShell />
          </RequireMember>
        }
      >
        <Route index element={<Navigate to={routes.today} replace />} />
        <Route
          path={routes.today}
          element={
            <L>
              <TodayPage />
            </L>
          }
        />
        <Route
          path={routes.learn}
          element={
            <L>
              <LearnPage />
            </L>
          }
        />
        <Route
          path={routes.learnVocabulary}
          element={
            <L>
              <LearnSectionPage kind="vocabulary" />
            </L>
          }
        />
        <Route
          path={routes.learnVocabularyDetail}
          element={
            <L>
              <LearnSectionPage kind="vocabulary" />
            </L>
          }
        />
        <Route
          path={routes.learnQuotes}
          element={
            <L>
              <LearnSectionPage kind="quotes" />
            </L>
          }
        />
        <Route
          path={routes.learnQuotesDetail}
          element={
            <L>
              <LearnSectionPage kind="quotes" />
            </L>
          }
        />
        <Route
          path={routes.learnCraft}
          element={
            <L>
              <LearnSectionPage kind="craft" />
            </L>
          }
        />
        <Route
          path={routes.learnCraftDetail}
          element={
            <L>
              <LearnSectionPage kind="craft" />
            </L>
          }
        />
        <Route
          path={routes.write}
          element={
            <L>
              <WritePage />
            </L>
          }
        />
        <Route
          path={routes.writeNew}
          element={
            <L>
              <WriteEditorPage />
            </L>
          }
        />
        <Route
          path={routes.writeDetail}
          element={
            <L>
              <WriteEditorPage />
            </L>
          }
        />
        <Route
          path={routes.novels}
          element={
            <L>
              <NovelsPage />
            </L>
          }
        />
        <Route
          path={routes.novelsNew}
          element={
            <L>
              <NovelsPage />
            </L>
          }
        />
        <Route
          path={routes.novelsDetail}
          element={
            <L>
              <NovelEditorPage />
            </L>
          }
        />
        <Route
          path={routes.novelsCharacters}
          element={
            <L>
              <NovelEntitiesPage />
            </L>
          }
        />
        <Route
          path={routes.novelsChapters}
          element={
            <L>
              <NovelEntitiesPage />
            </L>
          }
        />
        <Route
          path={routes.novelsScenes}
          element={
            <L>
              <NovelEntitiesPage />
            </L>
          }
        />
        <Route
          path={routes.japanese}
          element={
            <L>
              <JapanesePage />
            </L>
          }
        />
        <Route
          path={routes.japaneseKana}
          element={
            <L>
              <JapanesePage />
            </L>
          }
        />
        <Route
          path={routes.japaneseVocabulary}
          element={
            <L>
              <JapanesePage />
            </L>
          }
        />
        <Route
          path={routes.japaneseGrammar}
          element={
            <L>
              <JapanesePage />
            </L>
          }
        />
        <Route
          path={routes.review}
          element={
            <L>
              <ReviewPage />
            </L>
          }
        />
        <Route
          path={routes.favorites}
          element={
            <L>
              <FavoritesPage />
            </L>
          }
        />
        <Route
          path={routes.settings}
          element={
            <L>
              <SettingsPage />
            </L>
          }
        />
        <Route
          path={routes.ownerContent}
          element={
            <RequireOwner>
              <L>
                <OwnerContentPage />
              </L>
            </RequireOwner>
          }
        />
        <Route
          path="*"
          element={
            <L>
              <NotFoundPage />
            </L>
          }
        />
      </Route>
    </Routes>
  );
}
