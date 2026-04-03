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
    <div className="min-h-screen bg-[var(--ff-background)] text-[var(--ff-text)]">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex">
          <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[var(--ff-border)] bg-[var(--ff-surface)] p-5 lg:flex lg:flex-col">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--ff-primary)] text-white shadow-sm">
                <Timer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-[var(--ff-text)]">
                  {title}
                </p>
                <p className="text-[11px] text-[var(--ff-text-muted)]">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="mt-6 flex min-h-0 flex-1 flex-col">
              <SidebarNav activeKey={activeKey} onSelect={handleShellSelect} />
            </div>
          </aside>

          <div className="w-full">
            <header className="sticky top-0 z-30 border-b border-[var(--ff-border)] bg-[color:color-mix(in_srgb,var(--ff-surface)_88%,transparent)] backdrop-blur lg:hidden">
              <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--ff-primary)] text-white shadow-sm">
                    <Timer className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-semibold text-[var(--ff-text)]">
                      {title}
                    </p>
                    <p className="truncate text-xs text-[var(--ff-text-muted)]">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <button
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-soft)] text-[var(--ff-text-soft)]"
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </header>

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

                <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm border-l border-[var(--ff-border)] bg-[var(--ff-surface)] shadow-2xl">
                  <div className="flex h-full flex-col p-5">
                    <div className="flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ff-primary)] text-white">
                          <Timer className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[var(--ff-text)]">
                            {title}
                          </p>
                          <p className="text-xs text-[var(--ff-text-muted)]">
                            {subtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-soft)] text-[var(--ff-text-soft)]"
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Fechar menu"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
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