import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { IconPlus, IconClose, IconSpark, IconClock, IconArrowRight } from "@/components/ui-custom/CustomIcon";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { parseKpiPaste } from "@/lib/ai-suggest.functions";

/**
 * Send/schedule stub. There's no ESP wired up yet, so the buttons are
 * intentionally inert — they nudge the user to connect Integrations
 * instead of pretending to send mail. Acts as a discovery surface for
 * the (currently missing) send action.
 */
function SendStubGroup() {
  const notify = () =>
    toast.message("Подключите почтового провайдера, чтобы включить отправку", {
      description: "Lovable не поставляется с интеграцией исходящей почты по умолчанию.",
      action: { label: "Интеграции", onClick: () => window.location.assign("/integrations") },
    });
  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-glass-border bg-glass/30 p-0.5 sm:inline-flex">
      <button
        onClick={notify}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:bg-glass-strong hover:text-foreground"
        title="Отправить сейчас (требуется почтовый провайдер)"
      >
        <IconArrowRight size={12} /> Отправить
      </button>
      <span className="h-3 w-px bg-glass-border" aria-hidden />
      <button
        onClick={notify}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:bg-glass-strong hover:text-foreground"
        title="Запланировать (требуется почтовый провайдер)"
      >
        <IconClock size={12} /> Запланировать
      </button>
    </div>
  );
}

type Kpi = {
  id: string;
  workspace_id: string;
  org_id: string;
  channel: string;
  sent: number;
  opens: number;
  clicks: number;
  conversions: number;
  spend_cents: number;
  revenue_cents: number;
  notes: string | null;
};

const num = (n: number) => new Intl.NumberFormat().format(n || 0);
const money = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format((cents || 0) / 100);
const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

type PlanContext = {
  budgetCents: number;
  kpiLabel: string | null;
  kpiTarget: number | null;
  startDate: string | null;
  endDate: string | null;
};

export function ResultsSection({ workspaceId, orgId, currency, plan }: { workspaceId: string; orgId: string; currency: string; plan?: PlanContext }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Kpi[]>([]);
  const [paste, setPaste] = useState("");
  const [parsing, setParsing] = useState(false);
  const [plannedSpend, setPlannedSpend] = useState(0);
  const parse = useServerFn(parseKpiPaste);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data }, { data: budget }] = await Promise.all([
        supabase.from("workspace_kpis").select("*").eq("workspace_id", workspaceId).order("channel"),
        supabase.from("workspace_budget_lines").select("planned_cents").eq("workspace_id", workspaceId),
      ]);
      if (cancelled) return;
      setRows((data as Kpi[]) ?? []);
      setPlannedSpend((budget ?? []).reduce((s, b) => s + (b.planned_cents ?? 0), 0));
    };
    load();
    const ch = supabase
      .channel(`kpis-${workspaceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_kpis", filter: `workspace_id=eq.${workspaceId}` }, () => load())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [workspaceId]);

  const add = async () => {
    if (!user) return;
    await supabase.from("workspace_kpis").insert({
      workspace_id: workspaceId,
      org_id: orgId,
      channel: "email",
      created_by: user.id,
    });
  };
  const update = async (id: string, patch: Partial<Kpi>) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    await supabase.from("workspace_kpis").update(patch).eq("id", id);
  };
  const remove = async (id: string) => {
    setRows((cur) => cur.filter((r) => r.id !== id));
    await supabase.from("workspace_kpis").delete().eq("id", id);
  };

  const importPaste = async () => {
    if (!paste.trim() || !user) return;
    setParsing(true);
    try {
      const { rows: parsed } = await parse({ data: { paste } });
      if (parsed.length === 0) {
        toast.error("Не удалось разобрать ни одной строки");
      } else {
        await supabase.from("workspace_kpis").insert(
          parsed.map((p) => ({
            workspace_id: workspaceId,
            org_id: orgId,
            channel: String(p.channel ?? "unknown"),
            sent: Number(p.sent ?? 0),
            opens: Number(p.opens ?? 0),
            clicks: Number(p.clicks ?? 0),
            conversions: Number(p.conversions ?? 0),
            spend_cents: Number(p.spend_cents ?? 0),
            revenue_cents: Number(p.revenue_cents ?? 0),
            created_by: user.id,
          })),
        );
        toast.success(`Импортировано каналов: ${parsed.length}`);
        setPaste("");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось разобрать данные");
    } finally {
      setParsing(false);
    }
  };

  const total = rows.reduce(
    (a, r) => ({
      sent: a.sent + r.sent,
      opens: a.opens + r.opens,
      clicks: a.clicks + r.clicks,
      conversions: a.conversions + r.conversions,
      spend: a.spend + r.spend_cents,
      revenue: a.revenue + r.revenue_cents,
    }),
    { sent: 0, opens: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
  );

  const plannedBudget = (plan?.budgetCents ?? 0) || plannedSpend;
  const today = new Date();
  let elapsedPct: number | null = null;
  if (plan?.startDate && plan?.endDate) {
    const s = new Date(plan.startDate).getTime();
    const e = new Date(plan.endDate).getTime();
    const t = today.getTime();
    if (e > s) elapsedPct = Math.max(0, Math.min(100, ((t - s) / (e - s)) * 100));
  }
  const kpiActual = total.conversions;
  const kpiTarget = plan?.kpiTarget ?? 0;
  const kpiPct = kpiTarget > 0 ? Math.min(100, (kpiActual / kpiTarget) * 100) : null;
  const spendPct = plannedBudget > 0 ? Math.min(100, (total.spend / plannedBudget) * 100) : null;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Результаты</h2>
          <div className="mt-1 text-xs text-muted-foreground">Показатели по каналам. Вставьте отчёт для автозаполнения.</div>
        </div>
        <div className="flex items-center gap-2">
          <SendStubGroup />
          <button onClick={add} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            <IconPlus size={14} /> Добавить строку
          </button>
        </div>
      </div>

      {(plannedBudget > 0 || kpiTarget > 0 || elapsedPct !== null) && (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <PlanVsActualCard
            label={plan?.kpiLabel ?? "Конверсии"}
            actual={num(kpiActual)}
            target={kpiTarget > 0 ? num(kpiTarget) : "—"}
            pct={kpiPct}
            tone="primary"
          />
          <PlanVsActualCard
            label="Расходы"
            actual={money(total.spend, currency)}
            target={plannedBudget > 0 ? money(plannedBudget, currency) : "—"}
            pct={spendPct}
            tone={spendPct !== null && elapsedPct !== null && spendPct > elapsedPct + 10 ? "warn" : "primary"}
          />
          <PlanVsActualCard
            label="Сроки"
            actual={elapsedPct !== null ? `${elapsedPct.toFixed(0)}% прошло` : "—"}
            target={plan?.startDate && plan?.endDate ? `${plan.startDate} → ${plan.endDate}` : "нет дат"}
            pct={elapsedPct}
            tone="muted"
          />
        </div>
      )}

      <GlassPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="border-b border-glass-border bg-background/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Канал</th>
                <th className="px-2 py-2 text-right">Отправлено</th>
                <th className="px-2 py-2 text-right">Открытия</th>
                <th className="px-2 py-2 text-right">Клики</th>
                <th className="px-2 py-2 text-right">Конв.</th>
                <th className="px-2 py-2 text-right">Расходы</th>
                <th className="px-2 py-2 text-right">Доход</th>
                <th className="px-2 py-2 text-right">CTR</th>
                <th className="px-2 py-2 text-right">CPA</th>
                <th className="px-2 py-2 text-right">ROAS</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-muted-foreground">
                    Пока нет строк — добавьте строку или вставьте отчёт ниже.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-glass-border last:border-0">
                    <td className="px-3 py-1">
                      <input
                        value={r.channel}
                        onChange={(e) => setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, channel: e.target.value } : x)))}
                        onBlur={(e) => e.target.value !== r.channel && update(r.id, { channel: e.target.value })}
                        className="w-28 bg-transparent outline-none"
                      />
                    </td>
                    {(["sent", "opens", "clicks", "conversions", "spend_cents", "revenue_cents"] as const).map((f) => (
                      <td key={f} className="px-2 py-1 text-right">
                        <input
                          type="number"
                          value={r[f] ?? 0}
                          onChange={(e) => update(r.id, { [f]: Number(e.target.value) || 0 } as Partial<Kpi>)}
                          className="w-20 bg-transparent text-right font-mono outline-none"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-right font-mono text-muted-foreground">{pct(r.clicks, r.sent)}</td>
                    <td className="px-2 py-1 text-right font-mono text-muted-foreground">
                      {r.conversions > 0 ? money(Math.round(r.spend_cents / r.conversions), currency) : "—"}
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-muted-foreground">
                      {r.spend_cents > 0 ? `${(r.revenue_cents / r.spend_cents).toFixed(2)}x` : "—"}
                    </td>
                    <td className="text-center">
                      <button onClick={() => remove(r.id)} className="text-muted-foreground/50 hover:text-destructive">
                        <IconClose size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-background/30 font-mono text-[11px]">
                <tr>
                  <td className="px-3 py-2 text-left text-muted-foreground">Итого</td>
                  <td className="px-2 py-2 text-right">{num(total.sent)}</td>
                  <td className="px-2 py-2 text-right">{num(total.opens)}</td>
                  <td className="px-2 py-2 text-right">{num(total.clicks)}</td>
                  <td className="px-2 py-2 text-right">{num(total.conversions)}</td>
                  <td className="px-2 py-2 text-right">{money(total.spend, currency)}</td>
                  <td className="px-2 py-2 text-right">{money(total.revenue, currency)}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{pct(total.clicks, total.sent)}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">
                    {total.conversions > 0 ? money(Math.round(total.spend / total.conversions), currency) : "—"}
                  </td>
                  <td className="px-2 py-2 text-right text-muted-foreground">
                    {total.spend > 0 ? `${(total.revenue / total.spend).toFixed(2)}x` : "—"}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </GlassPanel>

      <div className="mt-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <IconSpark size={12} className="text-primary" /> Вставьте отчёт GA4 / ESP / рекламной платформы
        </div>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Вставьте строки из ESP, GA4, Meta, Google Ads…"
          rows={4}
          className="w-full rounded-md border border-glass-border bg-background/40 px-3 py-2 text-xs outline-none focus:border-primary/50"
        />
        {paste.trim() && (
          <button
            onClick={importPaste}
            disabled={parsing}
            className="mt-2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {parsing ? "Разбор…" : "Разобрать и импортировать"}
          </button>
        )}
      </div>
    </div>
  );
}

function PlanVsActualCard({
  label,
  actual,
  target,
  pct,
  tone,
}: {
  label: string;
  actual: string;
  target: string;
  pct: number | null;
  tone: "primary" | "warn" | "muted";
}) {
  const fill =
    tone === "warn" ? "bg-amber-500" : tone === "muted" ? "bg-muted-foreground/40" : "bg-primary";
  return (
    <GlassPanel className="p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2 font-mono">
        <span className="text-lg">{actual}</span>
        <span className="text-xs text-muted-foreground">/ {target}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/40">
        <div
          className={`h-full ${fill} transition-all`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      {pct !== null && (
        <div className="mt-1 text-right text-[10px] text-muted-foreground">{pct.toFixed(0)}%</div>
      )}
    </GlassPanel>
  );
}
