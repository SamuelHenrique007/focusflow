import { Bell, Clock3 } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ff-text)]">Notificações</h1>
            <p className="mt-1 text-sm text-[var(--ff-text-soft)]">
              Esta área pode centralizar avisos de foco, lembretes e novidades da gamificação.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-soft)] p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]">
          <Clock3 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-[var(--ff-text)]">Área pronta para expansão</h2>
        <p className="mt-2 text-sm text-[var(--ff-text-soft)]">
          Você já pode deixar esta tela no projeto e depois integrar notificações reais sem quebrar a navegação.
        </p>
      </div>
    </div>
  );
}
