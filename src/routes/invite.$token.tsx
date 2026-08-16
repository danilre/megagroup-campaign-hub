import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { GradientMesh } from "@/components/ui-custom/GradientMesh";
import { IconArrowRight, IconLogo } from "@/components/ui-custom/CustomIcon";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/invite/$token")({
  component: AcceptInvite,
});

type InviteInfo = {
  id: string;
  org_id: string;
  org_name: string;
  email: string;
  role: "owner" | "admin" | "member";
  expires_at: string;
  accepted_at: string | null;
};

function AcceptInvite() {
  const { token } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "expired" | "used">("loading");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("public_invite_by_token", { _token: token });
      const row = (data as InviteInfo[] | null)?.[0];
      if (error || !row) {
        setState("invalid");
        return;
      }
      setInvite(row);
      if (row.accepted_at) setState("used");
      else if (new Date(row.expires_at) < new Date()) setState("expired");
      else setState("ready");
    })();
  }, [token]);

  const accept = async () => {
    if (!user) return;
    setAccepting(true);
    const { data, error } = await supabase.rpc("accept_org_invite", { _token: token });
    setAccepting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Update the user's default org to the newly joined one
    if (data) {
      await supabase.from("profiles").update({ default_org_id: data as string }).eq("id", user.id);
    }
    toast.success(`Добро пожаловать в ${invite?.org_name}`);
    nav({ to: "/dashboard", replace: true });
  };

  const needsAuth = !authLoading && (!user || user.is_anonymous);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-ink)] text-foreground">
      <GradientMesh />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="flex items-center gap-2.5">
          <IconLogo size={26} className="text-primary" />
          <span className="font-display text-lg">{BRAND.name}</span>
        </div>

        <div className="mt-12 flex-1">
          {state === "loading" && (
            <GlassPanel tier="strong" className="h-64 animate-pulse" />
          )}

          {state === "invalid" && (
            <GlassPanel tier="strong" className="p-8 text-center">
              <h1 className="font-display text-2xl">Приглашение не найдено</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Эта ссылка недействительна или была отозвана. Попросите коллегу отправить новую.
              </p>
            </GlassPanel>
          )}

          {state === "expired" && invite && (
            <GlassPanel tier="strong" className="p-8 text-center">
              <h1 className="font-display text-2xl">Срок действия приглашения истёк</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Приглашение в <span className="text-foreground">{invite.org_name}</span> истекло.
                Попросите новую ссылку.
              </p>
            </GlassPanel>
          )}

          {state === "used" && invite && (
            <GlassPanel tier="strong" className="p-8 text-center">
              <h1 className="font-display text-2xl">Уже принято</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Это приглашение уже было использовано.
              </p>
              <Link
                to="/dashboard"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Перейти на дашборд <IconArrowRight size={14} />
              </Link>
            </GlassPanel>
          )}

          {state === "ready" && invite && (
            <GlassPanel tier="strong" className="p-8">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Вас пригласили
              </div>
              <h1 className="mt-2 font-display text-3xl">
                Присоединиться к {invite.org_name}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Вас пригласили присоединиться в роли{" "}
                <span className="text-foreground capitalize">{invite.role}</span>. Приглашение было отправлено
                на <span className="text-foreground">{invite.email}</span>.
              </p>

              {needsAuth ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Войдите, чтобы принять это приглашение.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Продолжить <IconArrowRight size={14} />
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    После входа вернитесь на эту страницу, чтобы принять приглашение.
                  </p>
                </div>
              ) : (
                <button
                  onClick={accept}
                  disabled={accepting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {accepting ? "Присоединение…" : `Принять приглашение`} <IconArrowRight size={14} />
                </button>
              )}
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
