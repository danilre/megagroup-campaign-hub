/**
 * Server-only Mailchimp Marketing API helpers.
 *
 * Auth: HTTP Basic with `anystring:<api key>`. The data-center prefix is the
 * suffix of the key itself (`abc123...-us21` → `https://us21.api.mailchimp.com/3.0`).
 * The key is read from `process.env.MAILCHIMP_API_KEY` and never leaves the server.
 */

export type MailchimpErrorCode =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "not_found"
  | "invalid_request"
  | "provider_error"
  | "network_error";

export class MailchimpError extends Error {
  code: MailchimpErrorCode;
  status: number;
  detail: string | undefined;

  constructor(code: MailchimpErrorCode, message: string, status = 0, detail?: string) {
    super(message);
    this.name = "MailchimpError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export type MailchimpFailure = {
  ok: false;
  code: MailchimpErrorCode;
  status: number;
  message: string;
};

/** Normalize any thrown error into a serializable failure payload for the UI. */
export function toMailchimpFailure(err: unknown): MailchimpFailure {
  if (err instanceof MailchimpError) {
    return { ok: false, code: err.code, status: err.status, message: err.message };
  }
  return {
    ok: false,
    code: "provider_error",
    status: 0,
    message: err instanceof Error ? err.message : "Неизвестная ошибка Mailchimp",
  };
}

function credentials() {
  const key = process.env.MAILCHIMP_API_KEY;
  if (!key) {
    throw new MailchimpError(
      "not_configured",
      "Mailchimp не подключён — сохраните ключ MAILCHIMP_API_KEY в настройках интеграций.",
    );
  }
  const dc = key.split("-").pop();
  if (!dc || !/^[a-z]{2}\d+$/i.test(dc)) {
    throw new MailchimpError(
      "not_configured",
      "Ключ Mailchimp выглядит некорректно — в нём нет суффикса дата-центра (например, -us21).",
    );
  }
  return {
    base: `https://${dc.toLowerCase()}.api.mailchimp.com/3.0`,
    auth: `Basic ${btoa(`lovable:${key}`)}`,
  };
}

function mapStatus(status: number, detail: string): MailchimpError {
  if (status === 401) {
    return new MailchimpError("unauthorized", "Неверный или отозванный API-ключ Mailchimp (401).", status, detail);
  }
  if (status === 403) {
    return new MailchimpError(
      "forbidden",
      "У ключа недостаточно прав для этого действия в Mailchimp (403).",
      status,
      detail,
    );
  }
  if (status === 404) {
    return new MailchimpError("not_found", "Ресурс не найден в Mailchimp (404).", status, detail);
  }
  if (status === 429) {
    return new MailchimpError(
      "rate_limited",
      "Превышен лимит запросов к Mailchimp (429) — попробуйте через минуту.",
      status,
      detail,
    );
  }
  if (status >= 400 && status < 500) {
    return new MailchimpError("invalid_request", detail || `Mailchimp отклонил запрос (${status}).`, status, detail);
  }
  return new MailchimpError("provider_error", detail || `Ошибка Mailchimp (${status}).`, status, detail);
}

async function mcFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { base, auth } = credentials();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (e) {
    throw new MailchimpError(
      "network_error",
      e instanceof Error ? e.message : "Не удалось связаться с Mailchimp.",
    );
  }

  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 500);
    try {
      const parsed = JSON.parse(text) as { detail?: string; title?: string };
      detail = parsed.detail || parsed.title || detail;
    } catch {
      /* keep raw text */
    }
    console.error(`Mailchimp ${path} failed [${res.status}]: ${detail}`);
    throw mapStatus(res.status, detail);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export type MailchimpPing = { account: string };

export async function ping(): Promise<MailchimpPing> {
  await mcFetch<{ health_status: string }>("/ping");
  const me = await mcFetch<{ account_name?: string }>("/?fields=account_name");
  return { account: me.account_name || "Mailchimp" };
}

export type MailchimpList = { id: string; name: string; memberCount: number };

export async function listAudiences(): Promise<MailchimpList[]> {
  const data = await mcFetch<{
    lists: { id: string; name: string; stats?: { member_count?: number } }[];
  }>("/lists?count=100&fields=lists.id,lists.name,lists.stats.member_count");
  return (data.lists ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    memberCount: l.stats?.member_count ?? 0,
  }));
}

export type MailchimpMemberInput = {
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  company?: string | undefined;
};

export type PushResult = {
  ok: true;
  created: number;
  updated: number;
  errored: { email: string; message: string }[];
};

export async function pushMembers(
  listId: string,
  members: MailchimpMemberInput[],
  status: "subscribed" | "pending",
): Promise<PushResult> {
  const body = {
    members: members.map((m) => ({
      email_address: m.email,
      status,
      merge_fields: {
        ...(m.firstName ? { FNAME: m.firstName } : {}),
        ...(m.lastName ? { LNAME: m.lastName } : {}),
        ...(m.company ? { COMPANY: m.company } : {}),
      },
    })),
    update_existing: true,
  };

  const res = await mcFetch<{
    new_members?: unknown[];
    updated_members?: unknown[];
    errors?: { email_address: string; error: string }[];
  }>(`/lists/${encodeURIComponent(listId)}`, { method: "POST", body });

  return {
    ok: true,
    created: res.new_members?.length ?? 0,
    updated: res.updated_members?.length ?? 0,
    errored: (res.errors ?? []).map((e) => ({ email: e.email_address, message: e.error })),
  };
}
