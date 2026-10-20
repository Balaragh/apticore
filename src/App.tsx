import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { LanguageProvider } from '@/contexts/language-context';
import { VoiceProvider } from '@/contexts/voice-context';
import { VoiceCaptionsOverlay } from '@/components/ui/voice-captions';
import { ProtectedRoute, PublicRoute } from '@/components/layout/route-guards';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// Pages
import LandingPage from '@/pages/landing';
import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';
import ForgotPasswordPage from '@/pages/auth/forgot-password';
import ResetPasswordPage from '@/pages/auth/reset-password';
import EmailVerificationPage from '@/pages/auth/email-verification';

// 8 Primary Navigation Sections
import DashboardPage from '@/pages/dashboard';
import CoursesPage from '@/pages/courses';
import CourseVideoInterviewPage from '@/pages/interview/course-video';
import AIMockInterviewPage from '@/pages/interview/mock';
import ResumePage from '@/pages/resume';
import ResumePracticePage from '@/pages/resume-practice';
import AptitudePage from '@/pages/aptitude';
import GroupDiscussionPage from '@/pages/group-discussion';

// Secondary & Ancillary Pages
import VideoInterviewPage from '@/pages/interview/video';
import InterviewSetupPage from '@/pages/interview/setup';
import InterviewSessionPage from '@/pages/interview/session';
import InterviewFeedbackPage from '@/pages/interview/feedback';
import InterviewSchedulePage from '@/pages/interview/schedule';
import LiveInterviewRoomPage from '@/pages/interview/live-room';
import InterviewModesPage from '@/pages/interview/modes';
import AIVideoInterviewPage from '@/pages/interview/ai-video';
import QuestionBankPage from '@/pages/questions';
import RoadmapPage from '@/pages/roadmap';
import AnalyticsPage from '@/pages/analytics';
import HistoryPage from '@/pages/history';
import SettingsPage from '@/pages/settings';
import NotFoundPage from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <VoiceProvider>
            <AuthProvider>
              <BrowserRouter>
                <VoiceCaptionsOverlay />
                <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    background: '#FFFFFF',
                    color: '#172033',
                    fontSize: '13px',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.08)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#16A34A',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#DC2626',
                      secondary: '#fff',
                    },
                  },
                }}
              />

              <Routes>
                {/* Public Landing */}
                <Route path="/" element={<LandingPage />} />

                {/* Public Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/verify-email"
                  element={
                    <PublicRoute>
                      <EmailVerificationPage />
                    </PublicRoute>
                  }
                />

                {/* Protected App Routes wrapped in Corporate DashboardLayout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* The 8 Primary Required Sections */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/interview/course-video" element={<CourseVideoInterviewPage />} />
                  <Route path="/interview/mock" element={<AIMockInterviewPage />} />
                  <Route path="/resume" element={<ResumePage />} />
                  <Route path="/resume/practice" element={<ResumePracticePage />} />
                  <Route path="/aptitude" element={<AptitudePage />} />
                  <Route path="/group-discussion" element={<GroupDiscussionPage />} />

                  {/* Secondary & Ancillary Workspaces */}
                  <Route path="/interview" element={<InterviewModesPage />} />
                  <Route path="/interview/modes" element={<InterviewModesPage />} />
                  <Route path="/interview/ai-video" element={<AIVideoInterviewPage />} />
                  <Route path="/interview/video" element={<VideoInterviewPage />} />
                  <Route path="/interview/setup" element={<InterviewSetupPage />} />
                  <Route path="/interview/session" element={<InterviewSessionPage />} />
                  <Route path="/interview/feedback/:id" element={<InterviewFeedbackPage />} />
                  <Route path="/interview/schedule" element={<InterviewSchedulePage />} />
                  <Route path="/interview/live" element={<Navigate to="/interview/schedule" replace />} />
                  <Route path="/questions" element={<QuestionBankPage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Dedicated Live Peer Interview Room (Supports both authenticated users and invited guests) */}
                <Route
                  path="/interview/live/:roomId"
                  element={<LiveInterviewRoomPage />}
                />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </VoiceProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
}
