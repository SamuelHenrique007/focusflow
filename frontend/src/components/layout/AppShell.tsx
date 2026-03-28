import React, { useEffect, useMemo, useState } from "react";
import { Menu, Timer, X } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { SidebarNav, type NavKey } from "@/components/layout/SidebarNav";
import { useAuth } from "@/hooks/useAuth";

function getActiveKey(pathname: string): NavKey {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/pomodoro")) return "pomodoro";
  if (pathname.startsWith("/stats")) return "stats";
  if (pathname.startsWith("/achievements")) return "achievements";
  if (pathname.startsWith("/store")) return "store";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/notifications")) return "notifications";

  return "dashboard";
}

export function AppShell({
  title = "FocusFlow",
  subtitle = "Produtividade & foco",
  rightActions,
}: {
  title?: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); 

  const activeKey = useMemo(
    () => getActiveKey(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    if (!mobileOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function handleShellSelect(key: NavKey) {
    if (key === "logout") {
      logout();
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex">
          
          {/* SIDEBAR DESKTOP */}
          <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
            
            {/* Adicionado shrink-0 aqui para o cabeçalho não ser esmagado */}
            <div className="flex items-center gap-2.5 shrink-0">
  {/* Caixa azul reduzida para h-8 w-8 e bordas levemente menores */}
  <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
    {/* Ícone interno reduzido para h-4 w-4 */}
    <Timer className="h-4 w-4" />
  </div>
  <div>
    {/* Título reduzido de text-base para text-sm */}
    <p className="text-sm font-semibold text-slate-900 leading-tight">{title}</p>
    {/* Subtítulo reduzido levemente com tamanho customizado [11px] */}
    <p className="text-[11px] text-slate-500">{subtitle}</p>
  </div>
</div>

            {/* Adicionado min-h-0 e mt-6 aqui para forçar o scroll interno */}
            <div className="mt-6 flex flex-1 flex-col min-h-0">
              <SidebarNav activeKey={activeKey} onSelect={handleShellSelect} />
            </div>

          </aside>

          {/* ÁREA PRINCIPAL */}
          <div className="w-full">
            {/* HEADER MOBILE */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur lg:hidden">
              <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Timer className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {title}
                    </p>
                    <p className="truncate text-xs text-slate-500">{subtitle}</p>
                  </div>
                </div>

                <button
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* MENU MOBILE EXPANDIDO */}
            {mobileOpen ? (
              <div
                className="fixed inset-0 z-50 lg:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
              >
                <div
                  className="absolute inset-0 bg-black/35"
                  onClick={() => setMobileOpen(false)}
                />

                <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl">
                  <div className="flex h-full flex-col p-5">
                    <div className="flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white">
                          <Timer className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {title}
                          </p>
                          <p className="text-xs text-slate-500">{subtitle}</p>
                        </div>
                      </div>

                      <button
                        className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Fechar menu"
                      >
                        <X className="h-5 w-5 text-slate-700" />
                      </button>
                    </div>

                    <div className="mt-6 flex flex-1 flex-col overflow-y-auto pr-1 min-h-0">
                      <SidebarNav
                        activeKey={activeKey}
                        onSelect={(key) => {
                          setMobileOpen(false);
                          handleShellSelect(key);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* CONTEÚDO DA PÁGINA */}
            <main className="p-4 sm:p-6 lg:p-8">
              <div className="hidden lg:flex lg:justify-end lg:pb-4">
                {rightActions ? rightActions : null}
              </div>

              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}