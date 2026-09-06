import { ArrowLeft, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardPreview } from "./CardPreview";
import { ImageSourcePicker } from "./ImageSourcePicker";
import type { CapturedImage } from "@/types/business-card";

interface ScanReviewProps {
  front: CapturedImage;
  back?: CapturedImage;
  onReplaceFront: () => void;
  onReplaceBack: () => void;
  onRemoveBack: () => void;
  onAddBack: (img: CapturedImage) => void;
  onScan: () => void;
  onBack: () => void;
}

export function ScanReview({
  front,
  back,
  onReplaceFront,
  onReplaceBack,
  onRemoveBack,
  onAddBack,
  onScan,
  onBack,
}: ScanReviewProps) {
  return (
    <div className="space-y-5 pb-28">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Review your card</h1>
        <p className="text-sm text-muted-foreground">
          Make sure both sides are sharp and fully visible.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <CardPreview label="Front" src={front.previewUrl} onReplace={onReplaceFront} />
        {back ? (
          <CardPreview
            label="Back"
            src={back.previewUrl}
            onReplace={onReplaceBack}
            onRemove={onRemoveBack}
          />
        ) : (
          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-dashed bg-card/50 p-5 text-center">
            <p className="text-sm text-muted-foreground">No back side added (optional)</p>
            <ImageSourcePicker compact onSelect={onAddBack} />
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button variant="outline" size="lg" className="h-12" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button size="lg" className="h-12 flex-1" onClick={onScan}>
            <ScanLine className="size-5" />
            Scan Business Card
          </Button>
        </div>
      </div>
    </div>
  );
}
