import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import {
  IconCalendar,
  IconChevronLeft,
  IconArrowRight,
  IconTrophy,
} from "@/components/ui-custom/CustomIcon";
import { PageHexBadge } from "@/components/app/PageHexBadge";

export const Route = createFileRoute("/_app/tools/events")({
  component: () => <EventsContent />,
  head: () => ({
    meta: [
      { title: "Мероприятия — Campaign-in-a-box" },
      {
        name: "description",
        content:
          "Запросите стенд на конференции, хакатон или митап. Мы превратим мероприятие в кампанию с правильной атрибуцией.",
      },
    ],
  }),
});

type EventKind = {
  to: string;
  search?: Record<string, string>;
  label: string;
  desc: string;
  Icon: typeof IconTrophy;
};

const KINDS: EventKind[] = [
  {
    to: "/tools",
    search: { focus: "campaign-hackathon" },
    label: "Заявка на мероприятие",
    desc: "Спонсируйте или проведите мероприятие — конференцию, хакатон или митап.",
    Icon: IconTrophy,
  },
];

export function EventsContent({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  return (
    <div className="space-y-8">
      {!hideHeader && (
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft size={14} /> Назад к инструментам
        </Link>
      )}

      {!hideHeader && (
        <header className="flex items-start gap-4">
          <PageHexBadge hue={150} icon={<IconCalendar size={26} />} aria-label="Мероприятия" />
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Мероприятия</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Отправьте заявку на мероприятие и превратите его в кампанию с собственной
              аудиторией, целевой страницей и импортом списка после мероприятия.
            </p>
          </div>
        </header>
      )}

      <p className="text-sm text-muted-foreground">
        Отправленные заявки попадают в вашу{" "}
        <Link to="/requests" className="text-primary hover:underline">очередь заявок</Link>{" "}
        для обработки и отображаются в{" "}
        <Link to="/calendar" className="text-primary hover:underline">календаре</Link>{" "}
        на дату исполнения.
      </p>



      <div className="max-w-2xl">
        {KINDS.map((k) => (
          <Link key={k.label} to={k.to} search={k.search} className="block">
            <GlassPanel
              className="flex items-center gap-5 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-glass-strong text-primary">
                <k.Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-display text-lg">
                  {k.label}
                </div>
                <div className="text-sm text-muted-foreground">{k.desc}</div>
              </div>
              <IconArrowRight size={18} className="text-muted-foreground" />
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
