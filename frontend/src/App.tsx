import { Routes, Route } from "react-router-dom";

import LandingPage from "@/pages/LandingPage";
import AuthFocusFlow from "@/components/AuthFocusFlow";
import Dashboard from "@/pages/Dashboard";
import ScrollToTop from "@/components/ScrollToTop";
import PomodoroTimer from "./components/PomodoroTimer";
import TasksPage from "./pages/TasksPage";
import ConquistasPage from "./pages/ConquistasPage";
import EstatisticasPage from "./pages/EstatisticasPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
//import ForgotPassword from "@/pages/ForgotPassword";
import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<AuthFocusFlow />} />
          <Route path="/register" element={<AuthFocusFlow />} />
          {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pomodoro" element={<PomodoroTimer />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/achievements" element={<ConquistasPage />} />
            <Route path="/stats" element={<EstatisticasPage />} />
          </Route>
        </Route>

        <Route path="*" element={<h1>Página não encontrada</h1>} />
      </Routes>
    </>
  );
}