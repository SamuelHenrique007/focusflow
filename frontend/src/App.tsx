import { Routes, Route } from "react-router-dom";

import LandingPage from "@/pages/LandingPage";
import AuthFocusFlow from "@/components/AuthFocusFlow";
import Dashboard from "@/pages/Dashboard";
import ScrollToTop from "@/components/ScrollToTop";
import PomodoroTimer from "./components/PomodoroTimer";
import TasksPage from "./pages/TasksPage";
import EstatisticasPage from "./pages/EstatisticasPage";
import PomodoroPage from "./pages/PomodoroPage";
import PomodoroFocusPage from "@/pages/pomodoro/PomodoroFocusPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { AppShell } from "./components/layout/AppShell";
import ConquistasPage from "@/pages/ConquistasPage";
import StorePage from "@/pages/StorePage";
import RewardToastViewport from "@/components/ui/RewardToastViewport";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RewardToastViewport />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<AuthFocusFlow />} />
          <Route path="/register" element={<AuthFocusFlow />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/pomodoro/focus" element={<PomodoroFocusPage />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pomodoro" element={<PomodoroTimer />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/stats" element={<EstatisticasPage />} />
            <Route path="/pomodoropage" element={<PomodoroPage />} />
            <Route path="/achievements" element={<ConquistasPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<h1>Página não encontrada</h1>} />
      </Routes>
    </>
  );
}