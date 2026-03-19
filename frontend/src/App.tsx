import { Routes, Route } from "react-router-dom";

import LandingPage from "@/pages/LandingPage";
import AuthFocusFlow from "@/components/AuthFocusFlow";
import Dashboard from "@/pages/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthFocusFlow />} />
      <Route path="/register" element={<AuthFocusFlow />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<h1>Página não encontrada</h1>} />
    </Routes>
  );
}