import PomodoroTimer from "@/components/PomodoroTimer";

export default function PomodoroPage() {
  return (
    <div className="space-y-6">
      {/* Header padrão igual TasksPage, Dashboard, Estatísticas etc */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Pomodoro
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Sessão de foco com técnica Pomodoro
        </p>
      </div>

      {/* Conteúdo */}
      <PomodoroTimer />
    </div>
  );
}