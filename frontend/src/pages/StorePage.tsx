import React, { useState } from "react";
import { 
  Store, 
  Coins, 
  Palette, 
  Music4, 
  Smile, 
  Check, 
  ShoppingCart,
  ArrowRightLeft,
  Timer,
  Volume2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/cn";

// Simulando os dados do utilizador
const USER_COINS = 350;
const FOCUS_POINTS = 120; // Minutos de foco acumulados

type FilterType = "all" | "avatar" | "theme" | "sound";

// Tipos de itens da loja
type StoreItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "avatar" | "theme" | "sound";
  icon?: React.ReactNode;
  emoji?: string;
  rarity: "Comum" | "Raro" | "Épico" | "Lendário";
  owned: boolean;
  equipped: boolean;
};

// Base de dados da loja
const STORE_ITEMS: StoreItem[] = [
  // AVATARES
  { id: "a1", name: "Raposa Furtiva", description: "Avatar para quem tem foco silencioso e letal.", price: 200, category: "avatar", emoji: "🦊", rarity: "Épico", owned: false, equipped: false },
  { id: "a2", name: "Coruja Noturna", description: "Para quem prefere focar na madrugada.", price: 150, category: "avatar", emoji: "🦉", rarity: "Raro", owned: true, equipped: true },
  { id: "a3", name: "Pinguim Frio", description: "Foco calculista e imperturbável.", price: 50, category: "avatar", emoji: "🐧", rarity: "Comum", owned: true, equipped: false },
  
  // TEMAS
  { id: "t1", name: "Aura Escura", description: "Tema noturno com detalhes em neon violeta.", price: 500, category: "theme", icon: <Palette size={20} />, rarity: "Lendário", owned: false, equipped: false },
  { id: "t2", name: "Floresta Zen", description: "Tons de verde esmeralda para acalmar a mente.", price: 300, category: "theme", icon: <Palette size={20} />, rarity: "Épico", owned: false, equipped: false },
  
  // SONS
  { id: "s1", name: "Campainha Neon", description: "Batida sintética ao finalizar o Pomodoro.", price: 100, category: "sound", icon: <Volume2 size={20} />, rarity: "Raro", owned: true, equipped: false },
  { id: "s2", name: "Toque Energético", description: "Um som elétrico para despertar o foco.", price: 150, category: "sound", icon: <Zap size={20} />, rarity: "Épico", owned: false, equipped: false },
  { id: "s3", name: "Som Relaxante", description: "Sino tibetano suave para iniciar a sessão.", price: 50, category: "sound", icon: <Music4 size={20} />, rarity: "Comum", owned: false, equipped: false },
];

// Definição das seções para renderização
const SECTIONS = [
  { id: "avatar", label: "Coleção de Avatares", icon: <Smile className="h-5 w-5 text-violet-500" /> },
  { id: "theme", label: "Temas Exclusivos", icon: <Palette className="h-5 w-5 text-violet-500" /> },
  { id: "sound", label: "Recompensas Sonoras", icon: <Music4 className="h-5 w-5 text-violet-500" /> },
];

export default function StorePage() {
  const [filter, setFilter] = useState<FilterType>("all");

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      
      {/* CABEÇALHO DA LOJA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            <Store className="h-8 w-8 text-violet-600" />
            Loja de Recompensas
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Troque o seu tempo e gaste moedas em personalizações lendárias.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-sm">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-200/50">
            <Coins className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">O seu Saldo</p>
            <p className="text-xl font-semibold text-amber-600">{USER_COINS} Moedas</p>
          </div>
        </div>
      </div>

      {/* ÁREA DE CÂMBIO */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-700 via-purple-600 to-violet-500 p-6 text-white shadow-md sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-violet-400/20 blur-xl"></div>
        
        <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex w-full items-center gap-4 sm:w-auto">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/20 shadow-inner">
              <ArrowRightLeft className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">Câmbio de Foco</h2>
              <div className="mt-1.5 flex flex-col items-start gap-1 text-sm text-violet-100 sm:flex-row sm:items-center sm:gap-2">
                <span>Tem <strong className="text-white">{FOCUS_POINTS} minutos</strong> acumulados</span>
                <span className="hidden h-1 w-1 rounded-full bg-violet-300 sm:block"></span>
                <span className="flex items-center gap-1 rounded-md bg-violet-900/30 px-2 py-0.5 text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                  Taxa: 10 <Timer className="h-3 w-3" /> = 5 <Coins className="h-3 w-3 text-amber-300" />
                </span>
              </div>
            </div>
          </div>
          
          <button className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-violet-700 shadow-sm transition-all hover:scale-[1.02] hover:bg-violet-50 hover:shadow sm:w-auto">
            <ArrowRightLeft className="h-4 w-4 transition-transform group-hover:rotate-180" />
            Converter em {Math.floor((FOCUS_POINTS / 10) * 5)} Moedas
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 pt-4">
        {[
          { id: "all", label: "Todos os Itens" },
          { id: "avatar", label: "Avatares", icon: <Smile className="h-4 w-4" /> },
          { id: "theme", label: "Temas", icon: <Palette className="h-4 w-4" /> },
          { id: "sound", label: "Sons", icon: <Music4 className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              filter === tab.id
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* VITRINE ORGANIZADA POR SEÇÕES */}
      <div className="space-y-10">
        {SECTIONS.map((section) => {
          // Filtra os itens desta seção específica
          const sectionItems = STORE_ITEMS.filter(
            (item) => item.category === section.id
          );

          // Se a aba selecionada não for "all" e for diferente desta seção, não renderiza nada
          if (filter !== "all" && filter !== section.id) return null;

          // Se não houver itens na seção, também não renderiza
          if (sectionItems.length === 0) return null;

          return (
            <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Título da Seção */}
              <div className="mb-4 flex items-center gap-2">
                {section.icon}
                <h2 className="text-lg font-semibold text-slate-800">{section.label}</h2>
              </div>

              {/* Grelha de Produtos da Seção */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sectionItems.map((item) => {
                  const canAfford = USER_COINS >= item.price;
                  
                  const rarityStyle = {
                    Comum: "bg-slate-100 text-slate-600",
                    Raro: "bg-sky-100 text-sky-700",
                    Épico: "bg-violet-100 text-violet-700",
                    Lendário: "bg-amber-100 text-amber-700",
                  }[item.rarity];

                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "group flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                        item.equipped ? "border-violet-300 ring-2 ring-violet-100" : "border-slate-200 hover:border-violet-200"
                      )}
                    >
                      {/* TOPO: Ícone, Raridade e Preço */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-105",
                          item.category === "avatar" ? "bg-slate-100" : "bg-violet-100 text-violet-600"
                        )}>
                          {item.category === "avatar" ? item.emoji : item.icon}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", rarityStyle)}>
                            {item.rarity}
                          </span>
                          {!item.owned && (
                            <div className={cn(
                              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm",
                              canAfford ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-slate-200 bg-slate-50 text-slate-500"
                            )}>
                              <Coins className="h-3.5 w-3.5" />
                              {item.price}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informações do Produto */}
                      <div className="mb-5">
                        <h3 className={cn("text-sm font-semibold", item.owned ? "text-slate-800" : "text-slate-600")}>
                          {item.name}
                        </h3>
                        <p className="min-h-10 mt-1 text-xs leading-relaxed text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      {/* Botão de Ação */}
                      {item.equipped ? (
                        <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-100 py-2.5 text-xs font-bold text-violet-700">
                          <Check className="h-4 w-4" /> Em Uso
                        </button>
                      ) : item.owned ? (
                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700">
                          Equipar
                        </button>
                      ) : (
                        <button 
                          disabled={!canAfford}
                          className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition",
                            canAfford 
                              ? "bg-violet-600 text-white shadow-sm hover:bg-violet-700" 
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                          )}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {canAfford ? "Comprar" : "Moedas Insuficientes"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

    </div>
  );
}