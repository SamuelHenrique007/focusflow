import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Minimize2 } from "lucide-react";

import PomodoroTimer from "@/components/PomodoroTimer"; // Ajuste o caminho se necessário

export default function PomodoroFocusPage() {
  const navigate = useNavigate();
  const location = useLocation(); // Captura o state com a tarefa selecionada

  useEffect(() => {
    async function enableFullscreen() {
      try {
        // Tenta entrar em tela cheia na montagem do componente
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.warn("O navegador bloqueou a tela cheia automática:", error);
      }
    }

    void enableFullscreen();

    return () => {
      async function exitFullscreen() {
        try {
          // Garante que saia da tela cheia ao desmontar o componente
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
    <main className="min-h-screen bg-slate-950 selection:bg-blue-500/30">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Cabeçalho do Modo Foco */}
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
            // Ao clicar em Sair, devolvemos a "mochila" (state) para a página normal
            // Assim a tarefa não se perde e continua selecionada no Select!
            onClick={() => navigate("/pomodoropage", { state: location.state })} 
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Sair do modo foco</span>
            <span className="inline sm:hidden">Sair</span>
          </button>
        </div>

        {/* Container Centralizado para o Timer */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <PomodoroTimer variant="focus" />
          </div>
        </div>
        
      </div>
    </main>
  );
}