import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function OriginalCardViewer({ front, back }: { front?: string; back?: string }) {
  if (!front) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="size-4" />
          View Original Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Original card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
              Front
            </p>
            <img src={front} alt="Front of the original card" className="w-full rounded-xl border" />
          </div>
          {back ? (
            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                Back
              </p>
              <img src={back} alt="Back of the original card" className="w-full rounded-xl border" />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
