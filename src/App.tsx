import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { useAuth } from '@/features/auth/AuthProvider';
import { PageLoader } from '@/components/ui/Feedback';
import { HomePage } from '@/pages/HomePage';

const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'));
const SubjectsPage = lazy(() => import('@/pages/SubjectsPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));

const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const TutorPage = lazy(() => import('@/pages/app/TutorPage'));
const QuizzesPage = lazy(() => import('@/pages/app/QuizzesPage'));
const QuizTakePage = lazy(() => import('@/pages/app/QuizTakePage'));
const NotesPage = lazy(() => import('@/pages/app/NotesPage'));
const FlashcardsPage = lazy(() => import('@/pages/app/FlashcardsPage'));
const PlannerPage = lazy(() => import('@/pages/app/PlannerPage'));
const ProgressPage = lazy(() => import('@/pages/app/ProgressPage'));
const ToolsPage = lazy(() => import('@/pages/app/ToolsPage'));
const ToolPage = lazy(() => import('@/pages/app/ToolPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/** Public auth pages are unavailable to signed-in students. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth();
  if (loading || (user && profileLoading)) return <PageLoader label="Checking your session…" />;
  if (user) return <Navigate to={profile?.onboardingComplete ? '/app' : '/onboarding'} replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route
              path="login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route
              path="signup"
              element={
                <GuestOnly>
                  <SignupPage />
                </GuestOnly>
              }
            />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="verify-email"
              element={
                <RequireAuth requireOnboarding={false}>
                  <VerifyEmailPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route
            path="onboarding"
            element={
              <RequireAuth requireOnboarding={false}>
                <OnboardingPage />
              </RequireAuth>
            }
          />

          <Route
            path="app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tutor" element={<TutorPage />} />
            <Route path="tutor/:conversationId" element={<TutorPage />} />
            <Route path="quizzes" element={<QuizzesPage />} />
            <Route path="quizzes/:quizId" element={<QuizTakePage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="planner" element={<PlannerPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/:toolId" element={<ToolPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
