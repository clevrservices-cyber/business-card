import { RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CardPreviewProps {
  label: string;
  src: string;
  onReplace?: () => void | undefined;
  onRemove?: () => void | undefined;
  className?: string | undefined;
}

export function CardPreview({ label, src, onReplace, onRemove, className }: CardPreviewProps) {
  return (
    <figure
      className={cn(
        "animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] duration-300",
        className,
      )}
    >
      <figcaption className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </span>
        <span className="flex gap-1">
          {onReplace ? (
            <Button variant="ghost" size="sm" onClick={onReplace}>
              <RefreshCcw className="size-4" />
              Replace
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </span>
      </figcaption>
      <div className="bg-surface p-3">
        <img
          src={src}
          alt={`${label} side of the business card`}
          className="mx-auto max-h-[320px] w-full rounded-xl object-contain"
        />
      </div>
    </figure>
  );
}
