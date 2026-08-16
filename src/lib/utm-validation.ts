/**
 * UTM-safe + naming sanity checks. Used inline on the UTM and Campaign Name tools.
 */

const UTM_SAFE = /^[a-z0-9_.\-+]+$/i;

export type UtmWarning = {
  field: "source" | "medium" | "campaign" | "term" | "content" | "name";
  level: "warn" | "error";
  message: string;
};

export function checkUtmField(field: UtmWarning["field"], value: string): UtmWarning | null {
  if (!value) return null;
  if (/\s/.test(value))
    return { field, level: "error", message: `${field} содержит пробелы — замените на "-" или "_"` };
  if (value !== value.toLowerCase())
    return { field, level: "warn", message: `${field} содержит заглавные буквы — большинство систем аналитики приводят их к нижнему регистру` };
  if (!UTM_SAFE.test(value))
    return { field, level: "error", message: `${field} содержит недопустимые символы — используйте буквы, цифры, "-", "_"` };
  if (value.length > 60)
    return { field, level: "warn", message: `${field}: ${value.length} симв. — длинные теги могут быть обрезаны` };
  return null;
}

export function checkDuplicate(name: string, existing: string[]): UtmWarning | null {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  if (existing.some((e) => e.trim().toLowerCase() === trimmed))
    return {
      field: "name",
      level: "error",
      message: "Кампания с точно таким названием уже существует",
    };
  // near-duplicates
  const close = existing.find((e) => {
    const a = e.trim().toLowerCase();
    if (a === trimmed) return false;
    const longer = a.length > trimmed.length ? a : trimmed;
    const shorter = a.length > trimmed.length ? trimmed : a;
    return longer.includes(shorter);
  });
  if (close) return { field: "name", level: "warn", message: `Очень похоже на существующее "${close}"` };
  return null;
}

export function checkTaxonomyDrift(
  segments: Record<string, string>,
  taxonomy: { channels?: string[]; regions?: string[]; quarters?: string[]; audiences?: string[]; objectives?: string[] },
): UtmWarning[] {
  const warnings: UtmWarning[] = [];
  const map: Record<string, string[] | undefined> = {
    channel: taxonomy.channels,
    region: taxonomy.regions,
    quarter: taxonomy.quarters,
    audience: taxonomy.audiences,
    objective: taxonomy.objectives,
  };
  for (const [key, value] of Object.entries(segments)) {
    const allowed = map[key];
    if (!allowed || !value) continue;
    if (!allowed.includes(value)) {
      warnings.push({
        field: "name",
        level: "warn",
        message: `${key} "${value}" отсутствует в вашей таксономии — обнаружено расхождение`,
      });
    }
  }
  return warnings;
}
