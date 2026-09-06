import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanErrorCode } from "@/types/business-card";

const COPY: Record<ScanErrorCode, { title: string; hint: string }> = {
  IMAGE_TOO_BLURRY: {
    title: "The image is too blurry",
    hint: "Hold the camera steady and make sure the whole card is in focus.",
  },
  IMAGE_UNPROCESSABLE: {
    title: "This image can't be processed",
    hint: "Try a photo with better lighting and the card flat against the surface.",
  },
  UNSUPPORTED_FORMAT: {
    title: "Unsupported image format",
    hint: "Use a JPG, PNG or WEBP image.",
  },
  UPLOAD_FAILED: {
    title: "Upload failed",
    hint: "Check your connection and try sending the card again.",
  },
  SCAN_FAILED: { title: "Scan failed", hint: "Something went wrong. Please try again." },
  NO_CONTACT_DETECTED: {
    title: "No contact information detected",
    hint: "Make sure the card fills the frame and the text is readable.",
  },
  PARTIAL_RESULT: {
    title: "Only part of the card could be read",
    hint: "You can continue and fill in the missing details manually.",
  },
};

interface ScanErrorStateProps {
  code: ScanErrorCode;
  /** Message supplied by the backend; shown verbatim when present. */
  message?: string;
  onRetry: () => void;
  onBack: () => void;
  onContinueAnyway?: () => void;
}

export function ScanErrorState({
  code,
  message,
  onRetry,
  onBack,
  onContinueAnyway,
}: ScanErrorStateProps) {
  const copy = COPY[code] ?? COPY.SCAN_FAILED;
  return (
    <section className="mx-auto w-full max-w-md space-y-6 py-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{message || copy.hint}</p>
      </div>
      <div className="grid gap-2">
        <Button size="lg" onClick={onRetry}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
        {onContinueAnyway ? (
          <Button variant="secondary" size="lg" onClick={onContinueAnyway}>
            Continue with partial details
          </Button>
        ) : null}
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to images
        </Button>
      </div>
    </section>
  );
}
