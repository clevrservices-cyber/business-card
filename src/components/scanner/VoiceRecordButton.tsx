import { Loader2, Mic, Square } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

interface VoiceRecordButtonProps {
  onTranscribed: (text: string) => void;
}

export function VoiceRecordButton({ onTranscribed }: VoiceRecordButtonProps) {
  const { status, elapsedMs, error, start, stop } = useVoiceRecorder({ onResult: onTranscribed });

  useEffect(() => {
    if (status === "error" && error) toast.error(error);
  }, [status, error]);

  if (status === "recording") {
    const seconds = Math.floor(elapsedMs / 1000);
    return (
      <Button type="button" variant="destructive" size="sm" className="h-8 gap-1.5" onClick={stop}>
        <Square className="size-3.5" />
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </Button>
    );
  }

  if (status === "transcribing") {
    return (
      <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled>
        <Loader2 className="size-3.5 animate-spin" />
        Transcribing...
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={start}>
      <Mic className="size-3.5" />
      Record
    </Button>
  );
}
