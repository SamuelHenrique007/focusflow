import React, { useEffect, useMemo, useState } from "react";
import { Menu, Timer, X } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { SidebarNav, type NavKey } from "@/components/layout/SidebarNav";
import { useAuth } from "@/hooks/useAuth";

function normalizeNameParts(name?: string) {
  if (!name?.trim()) return [];

  const connectors = ["de", "da", "do", "dos", "das", "e"];

  return name
    .trim()
    .split(" ")
    .filter((word) => word && !connectors.includes(word.toLowerCase()));
}

function getFirstAndSecondName(name?: string) {
  const parts = normalizeNameParts(name);

  if (parts.length === 0) return "Usuário";
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[1]}`;
}

function getInitials(username?: string, email?: string) {
  const parts = normalizeNameParts(username);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (email?.trim()) {
    return email.slice(0, 2).toUpperCase();
  }

  return "FF";
}

function getActiveKey(pathname: string): NavKey {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/pomodoro")) return "pomodoro";
  if (pathname.startsWith("/stats")) return "stats";
  if (pathname.startsWith("/achievements")) return "achievements";
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
  const { user, logout } = useAuth();

  const activeKey = useMemo(
    () => getActiveKey(location.pathname),
    [location.pathname],
  );

  const initials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.name, user?.email],
  );

  const shortName = useMemo(
    () => getFirstAndSecondName(user?.name),
    [user?.name],
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
          <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">{subtitle}</p>
              </div>
            </div>

            <SidebarNav activeKey={activeKey} onSelect={handleShellSelect} />

            <div className="mt-auto">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                    <span className="text-sm font-semibold text-slate-800">
                      {initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {shortName}
                    </p>
                    {user?.email ? (
                      <p className="truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="w-full">
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
                    <div className="flex items-center justify-between">
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

                    <div className="mt-6 flex-1 overflow-y-auto pr-1">
                      <SidebarNav
                        activeKey={activeKey}
                        onSelect={(key) => {
                          setMobileOpen(false);
                          handleShellSelect(key);
                        }}
                      />
                    </div>

                    <div className="mt-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                            <span className="text-sm font-semibold text-slate-800">
                              {initials}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {shortName}
                            </p>
                            {user?.email ? (
                              <p className="truncate text-xs text-slate-500">
                                {user.email}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
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