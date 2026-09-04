import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useDraft } from "@/hooks/use-draft";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { Button } from "@/components/ui/button";
import { ToolHeader } from "@/components/tools/ToolHeader";
import { IconChart, IconPlus, IconTrash } from "@/components/ui-custom/CustomIcon";

export const Route = createFileRoute("/_app/tools/budget")({
  component: BudgetRoiContent,
  head: () => ({
    meta: [
      { title: "Калькулятор бюджета и ROI кампаний" },
      {
        name: "description",
        content:
          "Посчитайте стоимость лида, стоимость сделки и окупаемость по каждому каналу до запуска кампании.",
      },
      { property: "og:title", content: "Калькулятор бюджета и ROI" },
      {
        property: "og:description",
        content: "CPL, CAC, выручка и ROMI по каналам — расчёт до запуска кампании.",
      },
    ],
  }),
});

type Row = {
  id: string;
  channel: string;
  budget: string;
  leads: string;
  toDeal: string; // % лидов, доходящих до сделки
  avgDeal: string; // средний чек
};

const EMPTY: Row = { id: "", channel: "", budget: "", leads: "", toDeal: "", avgDeal: "" };

function newRow(channel = "", preset: Partial<Row> = {}): Row {
  return { ...EMPTY, ...preset, id: crypto.randomUUID(), channel };
}

const DEFAULT_ROWS: Row[] = [
  { id: "r1", channel: "Контекст", budget: "300000", leads: "150", toDeal: "8", avgDeal: "180000" },
  { id: "r2", channel: "Email", budget: "60000", leads: "90", toDeal: "12", avgDeal: "180000" },
  { id: "r3", channel: "Мероприятия", budget: "450000", leads: "70", toDeal: "18", avgDeal: "260000" },
];

const money = (n: number) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";

export function BudgetRoiContent({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [rows, setRows] = useDraft<Row[]>("tools/budget:rows", DEFAULT_ROWS);

  const calc = useMemo(() => {
    const per = rows.map((r) => {
      const budget = Number(r.budget) || 0;
      const leads = Number(r.leads) || 0;
      const toDeal = Number(r.toDeal) || 0;
      const avgDeal = Number(r.avgDeal) || 0;
      const deals = (leads * toDeal) / 100;
      const revenue = deals * avgDeal;
      const cpl = leads > 0 ? budget / leads : 0;
      const cac = deals > 0 ? budget / deals : 0;
      const profit = revenue - budget;
      const romi = budget > 0 ? (profit / budget) * 100 : 0;
      return { ...r, budget, leads, deals, revenue, cpl, cac, profit, romi };
    });
    const total = per.reduce(
      (a, r) => ({
        budget: a.budget + r.budget,
        leads: a.leads + r.leads,
        deals: a.deals + r.deals,
        revenue: a.revenue + r.revenue,
      }),
      { budget: 0, leads: 0, deals: 0, revenue: 0 },
    );
    const totalProfit = total.revenue - total.budget;
    return {
      per,
      total: {
        ...total,
        profit: totalProfit,
        romi: total.budget > 0 ? (totalProfit / total.budget) * 100 : 0,
        cpl: total.leads > 0 ? total.budget / total.leads : 0,
        cac: total.deals > 0 ? total.budget / total.deals : 0,
      },
    };
  }, [rows]);

  const best = [...calc.per].sort((a, b) => b.romi - a.romi)[0];
  const worst = [...calc.per].sort((a, b) => a.romi - b.romi)[0];

  const cell =
    "w-full rounded-md border border-glass-border bg-glass/40 px-2 py-1.5 text-sm outline-none focus:border-primary/50";

  function update(id: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <ToolHeader
          eyebrow="Планирование"
          title="Бюджет и"
          accent="окупаемость"
          hue={200}
          icon={<IconChart size={22} />}
          description="Разложите план по каналам и посмотрите, что получится ещё до первого списания. Инструмент считает стоимость лида, стоимость сделки, выручку и возврат на вложенное."
        />
      )}

      <GlassPanel className="p-5">
        <h3 className="font-display text-lg">Как этим пользоваться</h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="text-foreground">1. Впишите каналы.</span> Один канал — одна строка.
            Контекст, email, мероприятия, партнёры, соцсети.
          </li>
          <li>
            <span className="text-foreground">2. Бюджет и ожидаемые лиды.</span> Берите цифры из
            прошлого квартала — раздел «Показатели» покажет фактический CPL по каждому каналу.
          </li>
          <li>
            <span className="text-foreground">3. Доля лидов до сделки.</span> Сколько процентов
            лидов реально доходят до оплаты. У холодной рекламы это 3–8%, у мероприятий — 15–25%.
          </li>
          <li>
            <span className="text-foreground">4. Средний чек.</span> Средняя сумма закрытой сделки
            по этому каналу — она часто различается: с конференций приходят более крупные клиенты.
          </li>
        </ol>
        <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          Дальше смотрите на возврат вложений (ROMI). Значение 100% означает, что канал вернул
          вложенное вдвое. Отрицательное — канал съедает деньги: либо сокращайте бюджет, либо
          чините конверсию, а не наливайте больше трафика.
        </p>
      </GlassPanel>

      <GlassPanel className="overflow-x-auto p-5">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="pb-2 pr-3 font-normal">Канал</th>
              <th className="pb-2 pr-3 font-normal">Бюджет</th>
              <th className="pb-2 pr-3 font-normal">Лиды</th>
              <th className="pb-2 pr-3 font-normal">До сделки, %</th>
              <th className="pb-2 pr-3 font-normal">Средний чек</th>
              <th className="pb-2 pr-3 font-normal">Цена лида</th>
              <th className="pb-2 pr-3 font-normal">Цена сделки</th>
              <th className="pb-2 pr-3 font-normal">Выручка</th>
              <th className="pb-2 pr-3 font-normal">ROMI</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {calc.per.map((r) => (
              <tr key={r.id} className="border-t border-glass-border/60">
                <td className="py-2 pr-3">
                  <input
                    className={cell}
                    value={r.channel}
                    placeholder="Канал"
                    onChange={(e) => update(r.id, { channel: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    className={cell}
                    inputMode="numeric"
                    value={r.budget}
                    onChange={(e) => update(r.id, { budget: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    className={cell}
                    inputMode="numeric"
                    value={r.leads}
                    onChange={(e) => update(r.id, { leads: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    className={cell}
                    inputMode="decimal"
                    value={r.toDeal}
                    onChange={(e) => update(r.id, { toDeal: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    className={cell}
                    inputMode="numeric"
                    value={r.avgDeal}
                    onChange={(e) => update(r.id, { avgDeal: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {money(r.cpl)}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {money(r.cac)}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">{money(r.revenue)}</td>
                <td
                  className={`py-2 pr-3 whitespace-nowrap font-medium ${
                    r.romi >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {r.romi.toFixed(0)}%
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    aria-label={`Удалить строку ${r.channel || "без названия"}`}
                    className="text-muted-foreground transition hover:text-red-400"
                    onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                  >
                    <IconTrash size={15} />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-glass-border">
              <td className="pt-3 pr-3 font-medium">Итого</td>
              <td className="pt-3 pr-3 whitespace-nowrap">{money(calc.total.budget)}</td>
              <td className="pt-3 pr-3">{calc.total.leads.toFixed(0)}</td>
              <td className="pt-3 pr-3 text-muted-foreground">
                {calc.total.leads > 0
                  ? ((calc.total.deals / calc.total.leads) * 100).toFixed(1)
                  : "0"}
              </td>
              <td className="pt-3 pr-3" />
              <td className="pt-3 pr-3 whitespace-nowrap">{money(calc.total.cpl)}</td>
              <td className="pt-3 pr-3 whitespace-nowrap">{money(calc.total.cac)}</td>
              <td className="pt-3 pr-3 whitespace-nowrap">{money(calc.total.revenue)}</td>
              <td
                className={`pt-3 pr-3 whitespace-nowrap font-semibold ${
                  calc.total.romi >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {calc.total.romi.toFixed(0)}%
              </td>
              <td />
            </tr>
          </tbody>
        </table>

        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => setRows((rs) => [...rs, newRow()])}
        >
          <IconPlus size={14} /> Добавить канал
        </Button>
      </GlassPanel>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassPanel className="p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Прибыль плана
          </div>
          <div
            className={`mt-1 font-display text-2xl ${
              calc.total.profit >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {money(calc.total.profit)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Выручка минус весь бюджет. Не забудьте, что себестоимость продукта сюда не входит.
          </p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Сильнейший канал
          </div>
          <div className="mt-1 font-display text-2xl">{best?.channel || "—"}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {best ? `Возврат ${best.romi.toFixed(0)}%. Сюда логично добавить бюджет.` : "Заполните таблицу."}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Требует внимания
          </div>
          <div className="mt-1 font-display text-2xl">{worst?.channel || "—"}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {worst
              ? `Возврат ${worst.romi.toFixed(0)}%. Проверьте качество лидов и работу отдела продаж.`
              : "Заполните таблицу."}
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}
