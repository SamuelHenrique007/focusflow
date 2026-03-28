import React from "react";
import { 
  Trophy, 
  Gift, 
  Lock, 
  Flame, 
  Clock, 
  Target, 
  Zap, 
  Shield, 
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/cn";

// Valores simulados para teste
const GOAL_PERCENTAGE = 100;
const CURRENT_PERCENTAGE = 75; 

// Baús baseados na porcentagem da meta
const CHESTS = [
  { id: 1, percent: 33, type: "Madeira", reward: "50 Moedas", claimed: true },
  { id: 2, percent: 66, type: "Prata", reward: "150 Moedas", claimed: false },
  { id: 3, percent: 100, type: "Ouro", reward: "Baú de Ouro", claimed: false },
];

const BADGES = [
  {
    id: 1,
    title: "Início da Jornada",
    description: "Completou sua primeira tarefa no FocusFlow.",
    icon: <Target className="h-6 w-6" />,
    color: "text-blue-600",
    bg: "bg-blue-100",
    unlocked: true,
  },
  {
    id: 2,
    title: "Foco de Monge",
    description: "Completou 4 Pomodoros seguidos sem pausas longas.",
    icon: <Clock className="h-6 w-6" />,
    color: "text-amber-600",
    bg: "bg-amber-100",
    unlocked: true,
  },
  {
    id: 3,
    title: "Série Implacável",
    description: "Manteve uma ofensiva de 7 dias consecutivos.",
    icon: <Flame className="h-6 w-6" />,
    color: "text-orange-600",
    bg: "bg-orange-100",
    unlocked: false,
    progress: 3,
    max: 7,
  },
  {
    id: 4,
    title: "Produtividade Máxima",
    description: "Concluiu 10 tarefas em um único dia.",
    icon: <Zap className="h-6 w-6" />,
    color: "text-purple-600",
    bg: "bg-purple-100",
    unlocked: false,
    progress: 4,
    max: 10,
  },
  {
    id: 5,
    title: "Guardião do Tempo",
    description: "Acumulou 100 horas totais de foco.",
    icon: <Shield className="h-6 w-6" />,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    unlocked: false,
    progress: 24,
    max: 100,
  },
];

export default function ConquistasPage() {
  const progressPercentage = Math.min((CURRENT_PERCENTAGE / GOAL_PERCENTAGE) * 100, 100);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      
      {/* CABEÇALHO */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          <Trophy className="h-8 w-8 text-amber-500" />
          Conquistas & Recompensas
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Acompanhe seu progresso, abra baús e colecione medalhas pelo seu esforço contínuo.
        </p>
      </div>

      {/* SESSÃO 1: TRILHA DE RECOMPENSAS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Trilha de Foco</h2>
            <p className="text-sm text-slate-500">
              Atingir 100% da sua meta garante o Baú de Ouro.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-semibold text-violet-600">{progressPercentage.toFixed(0)}%</span>
            <span className="text-sm font-semibold text-slate-300"> / 100%</span>
          </div>
        </div>

        {/* Barra de Progresso Interativa (Ajustada para ser mais fina e contida) */}
        <div className="relative mt-10 pb-24 sm:pb-28 px-4 sm:px-12">
          
          <div className="relative h-12 w-full">
            {/* Linha de fundo (cinza) - h-1.5 para ser bem fina */}
            <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-100"></div>
            
            {/* Linha de progresso (Violeta) */}
            <div 
              className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-violet-500 transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            ></div>

            {/* Os Nós (Baús) */}
            {CHESTS.map((chest) => {
              const isUnlocked = progressPercentage >= chest.percent;
              const isReady = isUnlocked && !chest.claimed;
              const isClaimed = isUnlocked && chest.claimed;
              const isLocked = !isUnlocked;
              
              return (
                <div 
                  key={chest.id} 
                  className="absolute flex flex-col items-center"
                  style={{ left: `${chest.percent}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Ícone do Baú */}
                  <div className={cn(
                    "z-10 grid h-12 w-12 place-items-center rounded-2xl border-4 border-white shadow-md transition-all duration-300 hover:scale-110",
                    isClaimed ? "bg-slate-200 text-slate-400" :
                    isReady ? "bg-amber-400 text-white animate-bounce ring-4 ring-amber-100" :
                    "bg-slate-50 text-slate-300"
                  )}>
                    {isLocked ? <Lock className="h-5 w-5" /> : <Gift className="h-6 w-6" />}
                  </div>
                  
                  {/* Info do Baú */}
                  <div className="mt-4 w-24 text-center">
                    <p className="text-xs font-semibold text-slate-900">{chest.type}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">{chest.percent}%</p>
                    
                    {/* Botão de Resgatar (Aparece centralizado) */}
                    {isReady && (
                      <button className="mt-3 whitespace-nowrap rounded-full bg-amber-500 px-4 py-1.5 text-[10px] font-black text-white shadow-lg shadow-amber-200 transition active:scale-95 hover:bg-amber-600">
                        RESGATAR
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>
      </section>

      {/* SESSÃO 2: GALERIA DE MEDALHAS */}
      <section className="pt-4">
        <h2 className="mb-6 text-xl font-semibold text-slate-800">Medalhas de Honra</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((badge) => (
            <div 
              key={badge.id}
              className={cn(
                "relative flex flex-col gap-4 rounded-3xl border p-6 transition-all hover:shadow-lg",
                badge.unlocked 
                  ? "border-slate-100 bg-white" 
                  : "border-slate-100 bg-slate-50/50 opacity-70 grayscale"
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn("grid h-12 w-12 place-items-center rounded-2xl shadow-sm", badge.bg, badge.color)}>
                  {badge.icon}
                </div>
                {badge.unlocked && (
                  <div className="rounded-full bg-emerald-100 p-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">{badge.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {badge.description}
                </p>
              </div>

              {/* Barra de progresso para medalhas bloqueadas */}
              {!badge.unlocked && badge.progress !== undefined && badge.max && (
                <div className="mt-auto pt-2">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase">
                    <span>Progresso</span>
                    <span>{badge.progress} / {badge.max}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div 
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${(badge.progress / badge.max) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}