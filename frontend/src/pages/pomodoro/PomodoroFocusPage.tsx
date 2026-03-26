import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Minimize2 } from "lucide-react";

import PomodoroTimer from "@/components/PomodoroTimer";

export default function PomodoroFocusPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function enableFullscreen() {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.error("Não foi possível entrar em tela cheia:", error);
      }
    }

    void enableFullscreen();

    return () => {
      async function exitFullscreen() {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          }
        } catch (error) {
          console.error("Não foi possível sair da tela cheia:", error);
        }
      }

      void exitFullscreen();
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              FocusFlow
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Modo Foco
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate("/pomodoro")}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Minimize2 className="h-4 w-4" />
            Sair do modo foco
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <PomodoroTimer variant="focus" />
          </div>
        </div>
      </div>
    </main>
  );
}