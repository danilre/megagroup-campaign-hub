import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import {
  IconTrophy,
  IconChevronLeft,
  IconArrowRight,
} from "@/components/ui-custom/CustomIcon";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org";
import { toast } from "sonner";
import { z } from "zod";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/tools/event-intake")({
  component: () => <HackathonRequestContent />,
  head: () => ({
    meta: [
      { title: `Заявка на мероприятие — ${BRAND.name}` },
      {
        name: "description",
        content:
          "Отправьте заявку на спонсорство или проведение мероприятия. Отдел маркетинга свяжется с вами.",
      },
    ],
  }),
});

const EVENT_TYPES = [
  { value: "conference", label: "Конференция" },
  { value: "hackathon", label: "Хакатон" },
  { value: "meetup", label: "Митап" },
  { value: "webinar", label: "Вебинар" },
  { value: "other", label: "Другое" },
] as const;

const schema = z.object({
  requesterEmail: z.string().trim().email("Введите корректный email").max(255),
  company: z.string().trim().min(1).max(120),
  eventType: z.enum(["conference", "hackathon", "meetup", "webinar", "other"]).optional(),
  eventName: z.string().trim().min(1).max(160),
  eventDate: z.string().trim().min(1, "Укажите дату"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

// Export name kept for import compatibility across the tools registry.
export function HackathonRequestContent({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const orgId = useOrgId();
  const [form, setForm, { clearDraft }] = useDraft("tools/hackathon-request:form", {
    requesterEmail: "",
    company: "",
    eventType: "" as "" | (typeof EVENT_TYPES)[number]["value"],
    eventName: "",
    eventDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set =
    (k: "requesterEmail" | "company" | "eventName" | "eventDate" | "notes") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, eventType: form.eventType === "" ? undefined : form.eventType };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!orgId) {
      toast.error("Рабочее пространство ещё не готово");
      return;
    }
    setSubmitting(true);
    const typeLabel = parsed.data.eventType
      ? EVENT_TYPES.find((t) => t.value === parsed.data.eventType)?.label ?? "Мероприятие"
      : "Мероприятие";
    const brief = `${typeLabel}: ${parsed.data.eventName}\nCompany: ${parsed.data.company}\nDate: ${parsed.data.eventDate}\n\n${parsed.data.notes ?? ""}`;
    const { error } = await supabase.from("campaign_requests").insert({
      org_id: orgId,
      requestor_email: parsed.data.requesterEmail,
      brief,
      status: "new",
      desired_due_date: parsed.data.eventDate,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось отправить. Попробуйте ещё раз.");
      return;
    }
    setDone(true);
    clearDraft();
  };

  if (done) {
    return (
      <div className="space-y-6">
        {!hideHeader && (
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft size={14} /> Назад к инструментам
          </Link>
        )}
        <GlassPanel className="p-10 text-center">
          <div className="font-display text-3xl">Заявка получена</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Мы добавили её в очередь заявок. Отдел маркетинга скоро свяжется с вами.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              to="/requests"
              className="rounded-full border border-glass-border px-4 py-2 text-sm hover:bg-glass"
            >
              Смотреть заявки
            </Link>
            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Назад к инструментам <IconArrowRight size={14} />
            </Link>
          </div>
        </GlassPanel>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {!hideHeader && (
        <>
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft size={14} /> Назад к инструментам
          </Link>

          <header className="flex items-start gap-4">
            <PageHexBadge hue={340} icon={<IconTrophy size={26} />} aria-label="Заявка на мероприятие" />
            <div>
              <h1 className="font-display text-3xl md:text-4xl">Заявка на мероприятие</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Отправьте заявку на спонсорство или проведение мероприятия — конференции, хакатона,
                митапа, вебинара или чего-то ещё. Команда маркетинга рассмотрит её из
                вашей очереди заявок.
              </p>
            </div>
          </header>
        </>
      )}
      <p className="-mt-3 text-sm text-muted-foreground">
        Отправленные заявки попадают в вашу{" "}
        <Link to="/requests" className="text-primary hover:underline">очередь заявок</Link>{" "}
        для обработки и отображаются в{" "}
        <Link to="/calendar" className="text-primary hover:underline">календаре</Link>{" "}
        на дату исполнения.
      </p>

      <GlassPanel className="p-6">
        <form onSubmit={submit} className="space-y-7">
          <fieldset className="space-y-4">
            <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Ваши контакты
            </legend>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Ваш email *</Label>
              <Input
                type="email"
                value={form.requesterEmail}
                onChange={set("requesterEmail")}
                className="glass border-glass-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Компания / организация *</Label>
              <Input
                value={form.company}
                onChange={set("company")}
                className="glass border-glass-border"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Детали мероприятия
            </legend>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Тип мероприятия</Label>
              <Select
                value={form.eventType || undefined}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, eventType: v as typeof f.eventType }))
                }
              >
                <SelectTrigger className="glass border-glass-border">
                  <SelectValue placeholder="Выберите тип мероприятия" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground/85">Название мероприятия *</Label>
                <Input
                  value={form.eventName}
                  onChange={set("eventName")}
                  className="glass border-glass-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground/85">Дата мероприятия *</Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={set("eventDate")}
                  className="glass border-glass-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Заметки</Label>
              <Textarea
                rows={4}
                placeholder="Формат, размер аудитории, что вы запрашиваете и т.д."
                value={form.notes}
                onChange={set("notes")}
                className="glass border-glass-border"
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Отправка…" : "Отправить заявку"}
            <IconArrowRight size={14} />
          </button>
        </form>
      </GlassPanel>
    </div>
  );
}
