import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SideSelector({
  onScanBack,
  onSkip,
}: {
  onScanBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] duration-300">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Layers className="size-4" />
        </span>
        <div>
          <h2 className="font-semibold">Does this business card have information on the back?</h2>
          <p className="text-sm text-muted-foreground">
            The back side is optional — skip it any time.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" className="h-12" onClick={onScanBack}>
          Yes, scan back
        </Button>
        <Button variant="outline" size="lg" className="h-12" onClick={onSkip}>
          No, continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
