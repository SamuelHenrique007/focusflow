"use client";

import React, { useEffect, useState } from "react";
import { Menu, Timer, X } from "lucide-react";

import { SidebarNav, type NavKey } from "@/components/layout/SidebarNav";

export function AppShell({
  activeKey,
  title = "FocusFlow",
  subtitle = "Produtividade & foco",
  userEmail,
  rightActions,
  children,
}: {
  activeKey: NavKey;
  title?: string;
  subtitle?: string;
  userEmail?: string;
  rightActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
                <p className="text-base font-semibold text-slate-900">
                  {title}
                </p>
                <p className="text-xs text-slate-500">{subtitle}</p>
              </div>
            </div>

            <SidebarNav activeKey={activeKey} />

            <div className="mt-auto">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                    <span className="text-sm font-semibold text-slate-800">
                      SH
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      Samuel Henrique
                    </p>
                    {userEmail ? (
                      <p className="truncate text-xs text-slate-500">
                        {userEmail}
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
                    <p className="truncate text-xs text-slate-500">
                      {subtitle}
                    </p>
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
                      <SidebarNav activeKey={activeKey} />
                    </div>

                    <div className="mt-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                            <span className="text-sm font-semibold text-slate-800">
                              SH
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              Samuel Henrique
                            </p>
                            {userEmail ? (
                              <p className="truncate text-xs text-slate-500">
                                {userEmail}
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

              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
