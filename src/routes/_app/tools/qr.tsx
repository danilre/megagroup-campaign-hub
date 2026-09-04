import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { Button } from "@/components/ui/button";
import { ToolHeader } from "@/components/tools/ToolHeader";
import { IconScroll, IconCopy, IconCheck } from "@/components/ui-custom/CustomIcon";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tools/qr")({
  component: QrCodeContent,
  head: () => ({
    meta: [
      { title: "QR-коды для кампаний — Справка и генератор" },
      {
        name: "description",
        content:
          "Сгенерируйте QR-код с UTM-метками для офлайн-материалов: печать, стенды, бейджи. Скачивание в PNG и SVG.",
      },
      { property: "og:title", content: "QR-коды для кампаний" },
      {
        property: "og:description",
        content: "QR-коды с UTM-метками для печатных и офлайн-материалов.",
      },
    ],
  }),
});

const LEVELS = [
  { value: "L", label: "L — 7% (чистый экран)" },
  { value: "M", label: "M — 15% (по умолчанию)" },
  { value: "Q", label: "Q — 25% (печать)" },
  { value: "H", label: "H — 30% (наклейки, улица)" },
] as const;

type Level = (typeof LEVELS)[number]["value"];

function withUtm(
  base: string,
  utm: { source: string; medium: string; campaign: string; content: string },
) {
  if (!base.trim()) return "";
  let url: URL;
  try {
    url = new URL(base.trim().startsWith("http") ? base.trim() : `https://${base.trim()}`);
  } catch {
    return base.trim();
  }
  const map: Record<string, string> = {
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    utm_content: utm.content,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v.trim()) url.searchParams.set(k, v.trim());
    else url.searchParams.delete(k);
  }
  return url.toString();
}

export function QrCodeContent({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [base, setBase] = useState("");
  const [utm, setUtm] = useState({ source: "qr", medium: "offline", campaign: "", content: "" });
  const [level, setLevel] = useState<Level>("M");
  const [size, setSize] = useState(512);
  const [png, setPng] = useState<string>("");
  const [svg, setSvg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const finalUrl = useMemo(() => withUtm(base, utm), [base, utm]);

  useEffect(() => {
    let cancelled = false;
    if (!finalUrl) {
      setPng("");
      setSvg("");
      return;
    }
    const opts = { errorCorrectionLevel: level, margin: 2, width: size } as const;
    Promise.all([
      QRCode.toDataURL(finalUrl, { ...opts }),
      QRCode.toString(finalUrl, { ...opts, type: "svg" }),
    ])
      .then(([dataUrl, svgStr]) => {
        if (cancelled) return;
        setPng(dataUrl);
        setSvg(svgStr);
      })
      .catch(() => {
        if (!cancelled) {
          setPng("");
          setSvg("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [finalUrl, level, size]);

  const fileName = (utm.campaign || "qr").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();

  function download(kind: "png" | "svg") {
    const href =
      kind === "png"
        ? png
        : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    if (!href) return;
    const a = document.createElement("a");
    a.href = href;
    a.download = `${fileName}.${kind}`;
    a.click();
  }

  async function copyLink() {
    if (!finalUrl) return;
    await navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    toast.success("Ссылка скопирована");
    setTimeout(() => setCopied(false), 1600);
  }

  const field =
    "w-full rounded-lg border border-glass-border bg-glass/40 px-3 py-2 text-sm outline-none focus:border-primary/50";
  const label = "mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <ToolHeader
          eyebrow="Офлайн-канал"
          title="QR-коды"
          accent="с UTM"
          hue={275}
          icon={<IconScroll size={22} />}
          description="Печатный носитель тоже канал. Соберите ссылку с метками и превратите её в QR-код — переходы со стенда, флаера или бейджа будут видны в отчётах наравне с рекламой."
        />
      )}

      <GlassPanel className="p-5">
        <h3 className="font-display text-lg">Зачем это нужно</h3>
        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          Без меток весь офлайн-трафик сливается в «прямые заходы», и конференция за 300 000 ₽
          выглядит в отчёте как ноль. QR с UTM-метками разделяет источники: стенд, раздатка,
          презентация, бейдж. Ставьте разный <code className="text-foreground">utm_content</code> на
          каждый носитель — и вы узнаете, что именно сработало.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>• Для печати берите уровень коррекции Q или H — код читается даже с царапинами.</li>
          <li>• Минимальный размер на печати — 2×2 см, иначе камера не сфокусируется.</li>
          <li>• SVG — для типографии, PNG — для презентаций и соцсетей.</li>
        </ul>
      </GlassPanel>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <GlassPanel className="space-y-4 p-5">
          <div>
            <label className={label}>Адрес страницы</label>
            <input
              className={field}
              placeholder="example.com/lp/autumn"
              value={base}
              onChange={(e) => setBase(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>utm_source</label>
              <input
                className={field}
                value={utm.source}
                onChange={(e) => setUtm((u) => ({ ...u, source: e.target.value }))}
                placeholder="qr"
              />
            </div>
            <div>
              <label className={label}>utm_medium</label>
              <input
                className={field}
                value={utm.medium}
                onChange={(e) => setUtm((u) => ({ ...u, medium: e.target.value }))}
                placeholder="offline"
              />
            </div>
            <div>
              <label className={label}>utm_campaign</label>
              <input
                className={field}
                value={utm.campaign}
                onChange={(e) => setUtm((u) => ({ ...u, campaign: e.target.value }))}
                placeholder="conf-2026"
              />
            </div>
            <div>
              <label className={label}>utm_content (носитель)</label>
              <input
                className={field}
                value={utm.content}
                onChange={(e) => setUtm((u) => ({ ...u, content: e.target.value }))}
                placeholder="stand-banner"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Устойчивость к повреждениям</label>
              <select
                className={field}
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Размер PNG, px</label>
              <input
                type="number"
                min={128}
                max={2048}
                step={64}
                className={field}
                value={size}
                onChange={(e) => setSize(Math.max(128, Math.min(2048, Number(e.target.value) || 512)))}
              />
            </div>
          </div>

          {finalUrl && (
            <div className="rounded-lg border border-glass-border bg-glass/30 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Итоговая ссылка
              </div>
              <div className="mt-1 break-all text-sm text-foreground">{finalUrl}</div>
              <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={copyLink}>
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />} Скопировать
              </Button>
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="flex flex-col items-center gap-4 p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Предпросмотр
          </div>
          {png ? (
            <img
              src={png}
              alt={`QR-код на ${finalUrl}`}
              className="w-full max-w-[240px] rounded-xl bg-white p-3"
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[240px] items-center justify-center rounded-xl border border-dashed border-glass-border text-center text-xs text-muted-foreground">
              Введите адрес страницы,
              <br />и здесь появится код
            </div>
          )}
          <div className="flex w-full gap-2">
            <Button className="flex-1" disabled={!png} onClick={() => download("png")}>
              PNG
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={!svg}
              onClick={() => download("svg")}
            >
              SVG
            </Button>
          </div>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Перед печатью обязательно отсканируйте код телефоном с готового макета.
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}
