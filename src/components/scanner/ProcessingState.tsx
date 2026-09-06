import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STAGES = [
  "Reading card",
  "Detecting contact information",
  "Identifying name and company",
  "Validating contact details",
  "Preparing contact",
];

/**
 * Purely visual pacing. It does not report real backend progress — when the
 * API starts streaming stage updates, drive `stage` from props instead.
 */
export function ProcessingState({ frontImage }: { frontImage: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 850);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="mx-auto w-full max-w-md space-y-8 py-6 text-center">
      <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        <img src={frontImage} alt="Business card being analysed" className="w-full object-contain" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-[scanline_2.2s_ease-in-out_infinite] bg-gradient-to-b from-primary/0 via-primary/25 to-primary/0" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Analyzing your business card...</h2>
        <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
      </div>

      <Progress value={((stage + 1) / STAGES.length) * 100} className="h-1.5" />

      <ul className="space-y-3 text-left">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className={cn(
              "flex items-center gap-3 text-sm transition-opacity duration-300",
              i > stage ? "opacity-40" : "opacity-100",
            )}
          >
            {i < stage ? (
              <Check className="size-4 text-success" />
            ) : i === stage ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="size-4 rounded-full border border-border" />
            )}
            <span className={i === stage ? "font-semibold" : ""}>{s}</span>
          </li>
        ))}
      </ul>

      <style>{`@keyframes scanline { 0%,100% { transform: translateY(-40%);} 50% { transform: translateY(300%);} }`}</style>
    </section>
  );
}
