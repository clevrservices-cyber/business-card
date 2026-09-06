import { AlertTriangle, Check, HelpCircle } from "lucide-react";
import type { ConfidenceLevel, ConfidenceMap } from "@/types/business-card";

export function resolveConfidence(
  map: ConfidenceMap | undefined,
  key: string,
): ConfidenceLevel | undefined {
  const raw = map?.[key];
  if (raw === undefined) return undefined;
  if (typeof raw === "number") return raw >= 0.85 ? "high" : raw >= 0.6 ? "medium" : "low";
  return raw;
}

const STYLES: Record<ConfidenceLevel, { cls: string; text: string; Icon: typeof Check }> = {
  high: { cls: "bg-success/12 text-success", text: "Confident", Icon: Check },
  medium: { cls: "bg-warning/18 text-warning-foreground", text: "Check", Icon: HelpCircle },
  low: { cls: "bg-destructive/12 text-destructive", text: "Review", Icon: AlertTriangle },
};

export function ConfidenceBadge({ level }: { level?: ConfidenceLevel }) {
  if (!level) return null;
  const { cls, text, Icon } = STYLES[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
      title={`Extraction confidence: ${level}`}
    >
      <Icon className="size-3" />
      {text}
    </span>
  );
}
