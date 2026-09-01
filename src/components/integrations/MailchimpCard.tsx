import { useState } from "react";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { Button } from "@/components/ui/button";
import { IconCheck, IconWarning } from "@/components/ui-custom/CustomIcon";
import { useServerFn } from "@tanstack/react-start";
import { mailchimpPing } from "@/lib/mailchimp.functions";

type State =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "ok"; account: string }
  | { kind: "error"; message: string; code: string };

export function MailchimpCard() {
  const ping = useServerFn(mailchimpPing);
  const [state, setState] = useState<State>({ kind: "idle" });

  const test = async () => {
    setState({ kind: "testing" });
    try {
      const res = await ping({});
      if (res.ok) setState({ kind: "ok", account: res.account });
      else setState({ kind: "error", message: res.message, code: res.code });
    } catch (e) {
      setState({
        kind: "error",
        code: "provider_error",
        message: e instanceof Error ? e.message : "Не удалось проверить подключение",
      });
    }
  };

  return (
    <GlassPanel className="space-y-4 p-5" data-testid="mailchimp-card">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white shadow-inner ring-1 ring-black/5">
          <img src="https://cdn.simpleicons.org/mailchimp" alt="" width={26} height={26} loading="lazy" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg leading-tight">Mailchimp</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Прямой API-ключ (без OAuth). Ключ хранится как секрет{" "}
            <code className="text-foreground">MAILCHIMP_API_KEY</code> и доступен только на сервере. Создать ключ:{" "}
            <a
              href="https://admin.mailchimp.com/account/api/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:opacity-80"
            >
              admin.mailchimp.com/account/api
            </a>
            .
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={test} disabled={state.kind === "testing"}>
          {state.kind === "testing" ? "Проверяем…" : "Проверить подключение"}
        </Button>

        {state.kind === "ok" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <IconCheck size={13} /> Подключено — {state.account}
          </span>
        )}
        {state.kind === "error" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <IconWarning size={13} /> {state.message}
          </span>
        )}
      </div>

      {state.kind === "error" && (
        <div className="rounded-xl border border-glass-border bg-glass/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          {state.code === "not_configured" &&
            "Ключ ещё не сохранён. Попросите Lovable сохранить секрет MAILCHIMP_API_KEY — и не добавляйте его в код."}
          {state.code === "unauthorized" && "Ключ неверный или отозван — создайте новый в кабинете Mailchimp."}
          {state.code === "forbidden" && "У ключа нет нужных прав — выпустите ключ от аккаунта с доступом к аудиториям."}
          {state.code === "rate_limited" && "Слишком много запросов к Mailchimp — подождите минуту и повторите."}
        </div>
      )}
    </GlassPanel>
  );
}
