import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { mailchimpAudiences, mailchimpPush } from "@/lib/mailchimp.functions";
import { toast } from "sonner";

export type MailchimpMember = {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
};

type ListItem = { id: string; name: string; memberCount: number };

export function PushToMailchimpDialog({
  open,
  onOpenChange,
  members,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  members: MailchimpMember[];
}) {
  const loadLists = useServerFn(mailchimpAudiences);
  const push = useServerFn(mailchimpPush);

  const [lists, setLists] = useState<ListItem[] | null>(null);
  const [listId, setListId] = useState("");
  const [status, setStatus] = useState<"subscribed" | "pending">("pending");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLists(null);
    void (async () => {
      try {
        const res = await loadLists({});
        if (res.ok) setLists(res.lists);
        else setError(res.message);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить аудитории");
      }
    })();
  }, [open, loadLists]);

  const capped = members.slice(0, 500);

  const submit = async () => {
    if (!listId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await push({ data: { listId, status, members: capped } });
      if (!("ok" in res) || res.ok !== true) {
        setError((res as { message: string }).message);
        return;
      }
      toast.success(
        `Mailchimp: добавлено ${res.created}, обновлено ${res.updated}${
          res.errored.length ? `, с ошибками ${res.errored.length}` : ""
        }`,
      );
      if (res.errored.length) {
        setError(
          `Не приняты ${res.errored.length} адресов: ${res.errored
            .slice(0, 3)
            .map((e) => `${e.email} — ${e.message}`)
            .join("; ")}`,
        );
      } else {
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Отправка не удалась");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Отправить в Mailchimp</DialogTitle>
          <DialogDescription>
            Контактов к отправке: {capped.length}
            {members.length > capped.length ? ` (из ${members.length}, за раз — не больше 500)` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Аудитория</div>
            <Select value={listId} onValueChange={setListId} disabled={!lists}>
              <SelectTrigger>
                <SelectValue placeholder={lists ? "Выберите список" : "Загрузка…"} />
              </SelectTrigger>
              <SelectContent>
                {(lists ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} · {l.memberCount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Статус подписки</div>
            <Select value={status} onValueChange={(v) => setStatus(v as "subscribed" | "pending")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending — двойное подтверждение</SelectItem>
                <SelectItem value="subscribed">Subscribed — есть согласие</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={busy || !listId || capped.length === 0}>
            {busy ? "Отправляем…" : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
