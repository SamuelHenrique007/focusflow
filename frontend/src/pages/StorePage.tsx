import { useEffect, useState } from "react";
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
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";

type FilterType = "all" | "avatar" | "theme" | "audio";

// Tipo exato que vem do seu Backend Django
type StoreItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  required_level: number;
  category: "avatar" | "theme" | "audio" | string;
  visual_resource?: string;
  rarity: "Comum" | "Raro" | "Épico" | "Lendário" | string;
  owned: boolean;
  equipped: boolean;
};

// Definição das seções mapeando as categorias do banco
const SECTIONS = [
  { id: "avatar", label: "Coleção de Avatares", icon: <Smile className="h-5 w-5 text-violet-500" /> },
  { id: "theme", label: "Temas Exclusivos", icon: <Palette className="h-5 w-5 text-violet-500" /> },
  { id: "audio", label: "Recompensas Sonoras", icon: <Music4 className="h-5 w-5 text-violet-500" /> },
];

export default function StorePage() {
  const { stats, fetchStatus } = useGameStore();
  
  const [items, setItems] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const userLevel = stats?.level || 1;
  const userCoins = stats?.coins || 0;
  const pendingCoins = (stats as unknown as { pending_focus_minutes?: number })?.pending_focus_minutes || 0;

  async function loadStoreItems() {
    try {
      setIsLoading(true);
      const { data } = await api.get<StoreItem[]>("/gamification/store/");
      setItems(data);
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
      setMessage({ type: "error", text: "Não foi possível carregar os itens da loja." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStoreItems();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function handleClaimCoins() {
    try {
      setIsClaiming(true);
      await api.post("/gamification/actions/claim-coins/");
      await fetchStatus(); 
      setMessage({ type: "success", text: `Resgataste ${pendingCoins} moedas com sucesso!` });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMessage({ type: "error", text: err.response?.data?.error || "Erro ao resgatar moedas." });
    } finally {
      setIsClaiming(false);
    }
  }

  async function handlePurchase(item: StoreItem) {
    if (userLevel < item.required_level) {
      setMessage({ type: "error", text: `Você precisa do Nível ${item.required_level}!` });
      return;
    }
    if (userCoins < item.price) {
      setMessage({ type: "error", text: "Moedas insuficientes!" });
      return;
    }

    try {
      setPurchasingId(item.id);
      const { data } = await api.post(`/gamification/store/${item.id}/purchase/`);
      setMessage({ type: "success", text: data.message || "Compra realizada com sucesso!" });
      await Promise.all([loadStoreItems(), fetchStatus()]);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Ocorreu um erro ao realizar a compra." 
      });
    } finally {
      setPurchasingId(null);
    }
  }

  function renderItemIcon(item: StoreItem) {
    if (item.visual_resource) return <span className="text-3xl">{item.visual_resource}</span>;
    if (item.category === 'theme') return <Palette className="h-6 w-6 text-violet-500" />;
    if (item.category === 'audio') return <Volume2 className="h-6 w-6 text-violet-500" />;
    return <Smile className="h-6 w-6 text-violet-500" />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      
      {/* Alertas */}
      {message && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 shadow-sm",
          message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
        )}>
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* CABEÇALHO DA LOJA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            <Store className="h-8 w-8 text-violet-600" />
            Loja de Recompensas
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Troque o seu tempo e gaste moedas em personalizações.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-sm">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-200/50">
            <Coins className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">O seu Saldo</p>
            <p className="text-xl font-bold text-amber-600">{userCoins} Moedas</p>
          </div>
        </div>
      </div>

      {/* ÁREA DE CÂMBIO DINÂMICA (Só aparece se tiver moedas pendentes) */}
      {pendingCoins > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-700 via-purple-600 to-violet-500 p-6 text-white shadow-md sm:p-8 animate-in fade-in slide-in-from-bottom-4">
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
                  <span>Tem <strong className="text-white">{pendingCoins} minutos</strong> de foco pendentes</span>
                  <span className="hidden h-1 w-1 rounded-full bg-violet-300 sm:block"></span>
                  <span className="flex items-center gap-1 rounded-md bg-violet-900/30 px-2 py-0.5 text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                    Taxa: 1 <Timer className="h-3 w-3" /> = 1 <Coins className="h-3 w-3 text-amber-300" />
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleClaimCoins}
              disabled={isClaiming}
              className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-violet-700 shadow-sm transition-all hover:scale-[1.02] hover:bg-violet-50 hover:shadow active:scale-95 sm:w-auto disabled:opacity-50"
            >
              <ArrowRightLeft className={cn("h-4 w-4 transition-transform", !isClaiming && "group-hover:rotate-180")} />
              {isClaiming ? "A converter..." : `Converter em ${pendingCoins} Moedas`}
            </button>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 pt-4">
        {[
          { id: "all", label: "Todos os Itens", icon: <Store className="h-4 w-4" /> },
          { id: "avatar", label: "Avatares", icon: <Smile className="h-4 w-4" /> },
          { id: "theme", label: "Temas", icon: <Palette className="h-4 w-4" /> },
          { id: "audio", label: "Sons", icon: <Music4 className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
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

      {/* CARREGAMENTO / VAZIO */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Store className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">A loja está vazia</h3>
          <p className="text-slate-500 mt-1">Volte mais tarde para ver as novidades!</p>
        </div>
      ) : (
        /* VITRINE ORGANIZADA POR SEÇÕES */
        <div className="space-y-10">
          {SECTIONS.map((section) => {
            const sectionItems = items.filter((item) => item.category === section.id);

            if (filter !== "all" && filter !== section.id) return null;
            if (sectionItems.length === 0) return null;

            return (
              <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-4 flex items-center gap-2">
                  {section.icon}
                  <h2 className="text-lg font-semibold text-slate-800">{section.label}</h2>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionItems.map((item) => {
                    const isLocked = userLevel < item.required_level;
                    const canAfford = userCoins >= item.price;
                    const isPurchasing = purchasingId === item.id;
                    
                    // Definindo as cores com base na raridade do backend
                    const raritySafe = item.rarity || "Comum";
                    const rarityStyle = {
                      "Comum": "bg-slate-100 text-slate-600",
                      "Raro": "bg-sky-100 text-sky-700",
                      "Épico": "bg-violet-100 text-violet-700",
                      "Lendário": "bg-amber-100 text-amber-700",
                    }[raritySafe] || "bg-slate-100 text-slate-600";

                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                          item.owned ? "border-violet-300 ring-2 ring-violet-50" : "border-slate-200 hover:border-violet-200",
                          isLocked ? "opacity-70 grayscale-[0.4]" : ""
                        )}
                      >
                        {/* Overlay de Bloqueio por Nível */}
                        {isLocked && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm z-10">
                            <Lock className="h-3 w-3" /> Nível {item.required_level}
                          </div>
                        )}

                        <div className="mb-4 flex items-start justify-between">
                          <div className={cn(
                            "flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 shadow-sm border border-slate-100",
                            item.category === "avatar" ? "bg-slate-50" : "bg-violet-50 text-violet-600"
                          )}>
                            {renderItemIcon(item)}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", rarityStyle)}>
                              {raritySafe}
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

                        <div className="mb-5 flex-1">
                          <h3 className={cn("text-base font-bold", item.owned ? "text-slate-900" : "text-slate-800")}>
                            {item.name}
                          </h3>
                          <p className="min-h-[40px] mt-1 text-xs leading-relaxed text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        {/* Botão de Ação */}
                        {item.owned ? (
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 border border-violet-100 py-3 text-xs font-bold text-violet-700">
                            <Check className="h-4 w-4" /> Comprado
                          </button>
                        ) : isLocked ? (
                          <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-400 cursor-not-allowed">
                            <Lock className="h-4 w-4" /> Bloqueado
                          </button>
                        ) : (
                          <button 
                            onClick={() => handlePurchase(item)}
                            disabled={!canAfford || isPurchasing}
                            className={cn(
                              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all active:scale-95",
                              canAfford 
                                ? "bg-violet-600 text-white shadow-sm hover:bg-violet-700 cursor-pointer" 
                                : "cursor-not-allowed bg-slate-100 text-slate-400"
                            )}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            {isPurchasing ? "A comprar..." : canAfford ? "Comprar" : "Moedas Insuficientes"}
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
      )}
    </div>
  );
}