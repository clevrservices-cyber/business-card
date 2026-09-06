import { Camera, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { CapturedImage } from "@/types/business-card";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/heic,image/heif";

interface ImageSourcePickerProps {
  onSelect: (image: CapturedImage) => void;
  onRejected?: (reason: string) => void | undefined;
  label?: string | undefined;
  compact?: boolean | undefined;
}

export function ImageSourcePicker({
  onSelect,
  onRejected,
  label,
  compact = false,
}: ImageSourcePickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onRejected?.("That file type isn't supported. Use a JPG, PNG or WEBP image.");
      return;
    }
    onSelect({ file, previewUrl: URL.createObjectURL(file) });
  };

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-2"}>
      {label ? <p className="sr-only">{label}</p> : null}
      <input
        ref={cameraRef}
        type="file"
        accept={ACCEPTED}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={uploadRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        size={compact ? "default" : "lg"}
        className={compact ? "" : "h-16 text-base"}
        onClick={() => cameraRef.current?.click()}
      >
        <Camera className="size-5" />
        Take Photo
      </Button>
      <Button
        variant="outline"
        size={compact ? "default" : "lg"}
        className={compact ? "" : "h-16 text-base"}
        onClick={() => uploadRef.current?.click()}
      >
        <Upload className="size-5" />
        Upload Image
      </Button>
    </div>
  );
}
