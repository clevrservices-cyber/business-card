import { CheckCircle2, ScanLine, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardPreview } from "./CardPreview";
import { ContactResults } from "./ContactResults";
import { ImageSourcePicker } from "./ImageSourcePicker";
import { ProcessingState } from "./ProcessingState";
import { ScanErrorState } from "./ScanErrorState";
import { ScanReview } from "./ScanReview";
import { SideSelector } from "./SideSelector";
import { ScanApiError, confirmContact, scanBusinessCard } from "@/lib/scan-api";
import type {
  CapturedImage,
  ContactData,
  ScanErrorCode,
  ScanResult,
} from "@/types/business-card";

type Step = "capture-front" | "ask-back" | "capture-back" | "review" | "processing" | "error" | "results" | "done";

export function BusinessCardScanner() {
  const [step, setStep] = useState<Step>("capture-front");
  const [front, setFront] = useState<CapturedImage>();
  const [back, setBack] = useState<CapturedImage>();
  const [result, setResult] = useState<ScanResult>();
  const [error, setError] = useState<{ code: ScanErrorCode; message?: string | undefined; partial?: ScanResult | undefined }>();
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    setFront(undefined);
    setBack(undefined);
    setResult(undefined);
    setError(undefined);
    setStep("capture-front");
  };

  const runScan = useCallback(async (f: CapturedImage, b?: CapturedImage) => {
    setStep("processing");
    setError(undefined);
    try {
      const res = await scanBusinessCard(f.file, b?.file);
      setResult(res);
      setStep("results");
    } catch (err) {
      if (err instanceof ScanApiError) {
        setError({ code: err.code, message: err.message, partial: err.partial });
      } else {
        setError({ code: "SCAN_FAILED", message: (err as Error)?.message });
      }
      setStep("error");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {step === "capture-front" || step === "ask-back" || step === "capture-back" ? (
          <div className="space-y-6">
            <header className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <ShieldCheck className="size-3.5" />
                Contact capture
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">Scan Business Card</h1>
              <p className="text-sm text-muted-foreground">
                Photograph or upload the card. The back side is always optional.
              </p>
            </header>

            {!front ? (
              <ImageSourcePicker
                onSelect={(img) => {
                  setFront(img);
                  setStep("ask-back");
                }}
                onRejected={(m) => toast.error(m)}
              />
            ) : (
              <div className="space-y-5">
                <CardPreview
                  label="Front"
                  src={front.previewUrl}
                  onReplace={() => {
                    setFront(undefined);
                    setStep("capture-front");
                  }}
                />

                {step === "ask-back" ? (
                  <SideSelector
                    onScanBack={() => setStep("capture-back")}
                    onSkip={() => setStep("review")}
                  />
                ) : null}

                {step === "capture-back" ? (
                  <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
                    <h2 className="font-semibold">Add the back side</h2>
                    <ImageSourcePicker
                      onSelect={(img) => {
                        setBack(img);
                        setStep("review");
                      }}
                      onRejected={(m) => toast.error(m)}
                    />
                    <Button variant="ghost" className="w-full" onClick={() => setStep("review")}>
                      Skip the back side
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {step === "review" && front ? (
          <ScanReview
            front={front}
            back={back}
            onReplaceFront={() => {
              setFront(undefined);
              setStep("capture-front");
            }}
            onReplaceBack={() => {
              setBack(undefined);
              setStep("capture-back");
            }}
            onRemoveBack={() => setBack(undefined)}
            onAddBack={setBack}
            onBack={() => setStep("ask-back")}
            onScan={() => runScan(front, back)}
          />
        ) : null}

        {step === "processing" && front ? <ProcessingState frontImage={front.previewUrl} /> : null}

        {step === "error" && error ? (
          <ScanErrorState
            code={error.code}
            message={error.message}
            onRetry={() => front && runScan(front, back)}
            onBack={() => setStep("review")}
            onContinueAnyway={
              error.partial
                ? () => {
                    setResult(error.partial);
                    setStep("results");
                  }
                : undefined
            }
          />
        ) : null}

        {step === "results" && result ? (
          <ContactResults
            result={result}
            confirming={confirming}
            onStartOver={reset}
            onConfirm={async (contact: ContactData) => {
              setConfirming(true);
              try {
                await confirmContact({
                  contact,
                  front_image: result.front_image,
                  back_image: result.back_image,
                });
                setStep("done");
              } catch {
                toast.error("Could not send the contact. Please try again.");
              } finally {
                setConfirming(false);
              }
            }}
          />
        ) : null}

        {step === "done" ? (
          <section className="mx-auto max-w-md space-y-6 py-16 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/12 text-success">
              <CheckCircle2 className="size-7" />
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Contact confirmed</h2>
              <p className="text-sm text-muted-foreground">
                The finalized contact is ready to be handed to your backend.
              </p>
            </div>
            <Button size="lg" className="h-12 w-full" onClick={reset}>
              <ScanLine className="size-5" />
              Scan another card
            </Button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
