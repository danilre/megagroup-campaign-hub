import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { Button } from "@/components/ui/button";
import { ToolHeader } from "@/components/tools/ToolHeader";
import { IconCalendar, IconPlus, IconTrash } from "@/components/ui-custom/CustomIcon";

export const Route = createFileRoute("/_app/tools/content-plan")({
  component: ContentPlanContent,
  head: () => ({
    meta: [
      { title: "Планировщик контента по каналам" },
      {
        name: "description",
        content:
          "Сетка публикаций по неделям и каналам: тема, формат, ответственный, статус. Видно дыры в графике и перекос по каналам.",
      },
      { property: "og:title", content: "Планировщик контента" },
      {
        property: "og:description",
        content: "График публикаций по неделям и каналам с ответственными и статусами.",
      },
    ],
  }),
});

const CHANNELS = ["Блог", "Email", "Соцсети", "Вебинар", "Видео", "Рассылка партнёрам"] as const;
const FORMATS = ["Статья", "Кейс", "Дайджест", "Анонс", "Инструкция", "Интервью"] as const;
const STATUSES = [
  { value: "idea", label: "Идея" },
  { value: "draft", label: "В работе" },
  { value: "review", label: "На проверке" },
  { value: "scheduled", label: "Запланировано" },
  { value: "published", label: "Опубликовано" },
] as const;

type Status = (typeof STATUSES)[number]["value"];

type Item = {
  id: string;
  date: string;
  channel: string;
  format: string;
  title: string;
  owner: string;
  status: Status;
};

const STATUS_CLASS: Record<Status, string> = {
  idea: "bg-muted/40 text-muted-foreground",
  draft: "bg-amber-500/15 text-amber-400",
  review: "bg-sky-500/15 text-sky-400",
  scheduled: "bg-violet-500/15 text-violet-400",
  published: "bg-emerald-500/15 text-emerald-400",
};

function weekKey(dateStr: string) {
  if (!dateStr) return "Без даты";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Без даты";
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const f = (x: Date) =>
    x.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return `${f(monday)} — ${f(sunday)}`;
}

export function ContentPlanContent({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [items, setItems] = useDraft<Item[]>("tools/content-plan:items", []);
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const visible = useMemo(
    () => items.filter((i) => channelFilter === "all" || i.channel === channelFilter),
    [items, channelFilter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const i of [...visible].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"))) {
      const k = weekKey(i.date);
      map.set(k, [...(map.get(k) ?? []), i]);
    }
    return [...map.entries()];
  }, [visible]);

  const byChannel = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.channel, (m.get(i.channel) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  function add() {
    setItems((xs) => [
      ...xs,
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        channel: CHANNELS[0],
        format: FORMATS[0],
        title: "",
        owner: "",
        status: "idea",
      },
    ]);
  }

  function update(id: string, patch: Partial<Item>) {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  const cell =
    "w-full rounded-md border border-glass-border bg-glass/40 px-2 py-1.5 text-sm outline-none focus:border-primary/50";

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <ToolHeader
          eyebrow="Регулярность"
          title="Планировщик"
          accent="контента"
          hue={150}
          icon={<IconCalendar size={22} />}
          description="Сетка публикаций по неделям и каналам: тема, формат, ответственный, статус. Сразу видно пустые недели и перекос в один канал."
        />
      )}

      <GlassPanel className="p-5">
        <h3 className="font-display text-lg">Зачем нужен план публикаций</h3>
        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          Контент работает накопительно: важнее ритм, чем разовый удачный текст. План вперёд на
          4–6 недель убирает главную причину простоя — «а что мы вообще публикуем на этой неделе».
          Он же показывает перекос: если девять карточек из десяти в соцсетях, ваша воронка
          держится на одном канале.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>
            • <span className="text-foreground">Правило одной темы.</span> Одна тема недели —
            несколько форматов: статья, письмо, короткое видео. Так дешевле и последовательнее.
          </li>
          <li>
            • <span className="text-foreground">Ответственный обязателен.</span> Карточка без имени
            не выходит — это проверено на любой команде.
          </li>
          <li>
            • <span className="text-foreground">Статусы — не украшение.</span> Всё, что дольше
            недели висит «В работе», обсуждается на планёрке.
          </li>
          <li>
            • Ссылки в публикациях размечайте UTM-конструктором, иначе вклад контента не будет виден
            в разделе «Показатели».
          </li>
        </ul>
      </GlassPanel>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setChannelFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            channelFilter === "all"
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-glass-border bg-glass/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          Все каналы ({items.length})
        </button>
        {byChannel.map(([ch, n]) => (
          <button
            key={ch}
            type="button"
            onClick={() => setChannelFilter(ch)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              channelFilter === ch
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-glass-border bg-glass/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {ch} ({n})
          </button>
        ))}
        <Button size="sm" className="ml-auto gap-2" onClick={add}>
          <IconPlus size={14} /> Добавить публикацию
        </Button>
      </div>

      {items.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            План пуст. Начните с четырёх карточек на ближайший месяц — по одной на неделю.
          </p>
          <Button className="mt-4 gap-2" onClick={add}>
            <IconPlus size={14} /> Первая публикация
          </Button>
        </GlassPanel>
      ) : (
        <div className="space-y-5">
          {groups.map(([week, list]) => (
            <GlassPanel key={week} className="overflow-x-auto p-5">
              <div className="mb-3 flex items-baseline gap-3">
                <h3 className="font-display text-base">{week}</h3>
                <span className="text-xs text-muted-foreground">
                  {list.length} публикаци{list.length === 1 ? "я" : list.length < 5 ? "и" : "й"}
                </span>
              </div>
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="pb-2 pr-3 font-normal">Дата</th>
                    <th className="pb-2 pr-3 font-normal">Канал</th>
                    <th className="pb-2 pr-3 font-normal">Формат</th>
                    <th className="pb-2 pr-3 font-normal">Тема</th>
                    <th className="pb-2 pr-3 font-normal">Ответственный</th>
                    <th className="pb-2 pr-3 font-normal">Статус</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.id} className="border-t border-glass-border/60">
                      <td className="py-2 pr-3">
                        <input
                          type="date"
                          className={cell}
                          value={i.date}
                          onChange={(e) => update(i.id, { date: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          className={cell}
                          value={i.channel}
                          onChange={(e) => update(i.id, { channel: e.target.value })}
                        >
                          {CHANNELS.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          className={cell}
                          value={i.format}
                          onChange={(e) => update(i.id, { format: e.target.value })}
                        >
                          {FORMATS.map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          className={cell}
                          placeholder="О чём материал"
                          value={i.title}
                          onChange={(e) => update(i.id, { title: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          className={cell}
                          placeholder="Имя"
                          value={i.owner}
                          onChange={(e) => update(i.id, { owner: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          className={`${cell} ${STATUS_CLASS[i.status]}`}
                          value={i.status}
                          onChange={(e) => update(i.id, { status: e.target.value as Status })}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          aria-label="Удалить публикацию"
                          className="text-muted-foreground transition hover:text-red-400"
                          onClick={() => setItems((xs) => xs.filter((x) => x.id !== i.id))}
                        >
                          <IconTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
