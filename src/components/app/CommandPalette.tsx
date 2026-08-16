import { useEffect, useState, useCallback } from "react";
import { copyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  IconWorkspace,
  IconCampaign,
  IconImport,
  IconUtm,
  IconHome,
  IconSettings,
  IconPlus,
  IconCalendar,
  IconTemplate,
} from "@/components/ui-custom/CustomIcon";

type WsRow = { id: string; name: string; updated_at: string };
type CampaignRow = { id: string; name: string; workspace_id: string | null };
type UtmRow = { id: string; label: string; final_url: string; workspace_id: string | null };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  const [workspaces, setWorkspaces] = useState<WsRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [utm, setUtm] = useState<UtmRow[]>([]);

  // Global ⌘K / ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lazy-load search data when opened
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      const [{ data: ws }, { data: cs }, { data: us }] = await Promise.all([
        supabase
          .from("workspaces")
          .select("id,name,updated_at")
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase
          .from("campaigns")
          .select("id,name,workspace_id")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("utm_links")
          .select("id,label,final_url,workspace_id")
          .order("created_at", { ascending: false })
          .limit(15),
      ]);
      if (cancelled) return;
      setWorkspaces((ws as WsRow[]) ?? []);
      setCampaigns((cs as CampaignRow[]) ?? []);
      setUtm((us as UtmRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const go = useCallback(
    (fn: () => void) => {
      setOpen(false);
      // tiny delay so the dialog can unmount cleanly
      setTimeout(fn, 10);
    },
    [],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Поиск по кампаниям, инструментам, названиям, UTM…" />
      <CommandList>
        <CommandEmpty>Ничего не найдено.</CommandEmpty>

        <CommandGroup heading="Быстрые действия">
          <CommandItem onSelect={() => go(() => nav({ to: "/dashboard" }))}>
            <IconHome size={16} /> На этой неделе
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go(() => nav({ to: "/campaigns" }))}>
            <IconWorkspace size={16} /> Кампании
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go(() => nav({ to: "/calendar" }))}>
            <IconCalendar size={16} /> Календарь
          </CommandItem>
          <CommandItem onSelect={() => go(() => nav({ to: "/templates" }))}>
            <IconTemplate size={16} /> Шаблоны
          </CommandItem>
          <CommandItem onSelect={() => go(() => nav({ to: "/settings" }))}>
            <IconSettings size={16} /> Настройки
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Инструменты">
          <CommandItem onSelect={() => go(() => nav({ to: "/tools", search: { focus: "utm-campaign-name" } }))}>
            <IconCampaign size={16} /> Генератор названий кампаний
          </CommandItem>
          <CommandItem onSelect={() => go(() => nav({ to: "/tools", search: { focus: "campaign-import" } }))}>
            <IconImport size={16} /> Импорт списка
          </CommandItem>
          <CommandItem onSelect={() => go(() => nav({ to: "/tools", search: { focus: "utm" } }))}>
            <IconUtm size={16} /> UTM-конструктор
          </CommandItem>
        </CommandGroup>

        {workspaces.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Кампании">
              <CommandItem
                onSelect={() =>
                  go(() => {
                    // navigate to list so user can press "New campaign"
                    nav({ to: "/campaigns" });
                  })
                }
              >
                <IconPlus size={16} /> Новая кампания
              </CommandItem>
              {workspaces.map((w) => (
                <CommandItem
                  key={w.id}
                  value={`campaign ${w.name} ${w.id}`}
                  onSelect={() =>
                    go(() => nav({ to: "/campaigns/$id", params: { id: w.id } }))
                  }
                >
                  <IconWorkspace size={16} /> {w.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {campaigns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Сохранённые названия кампаний">
              {campaigns.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`campaign ${c.name}`}
                  onSelect={() =>
                    go(() => {
                      copyToClipboard(c.name);
                    })
                  }
                >
                  <IconCampaign size={16} />
                  <span className="font-mono truncate">{c.name}</span>
                  <CommandShortcut>копия</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {utm.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="UTM-ссылки">
              {utm.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`utm ${u.label} ${u.final_url}`}
                  onSelect={() =>
                    go(() => {
                      copyToClipboard(u.final_url);
                    })
                  }
                >
                  <IconUtm size={16} />
                  <span className="truncate">{u.label}</span>
                  <CommandShortcut>копия</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

      </CommandList>
    </CommandDialog>
  );
}
