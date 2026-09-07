import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "./DateField";
import { VoiceRecordButton } from "./VoiceRecordButton";
import type { ActionItem } from "@/types/business-card";

interface ActionsListProps {
  actions: ActionItem[];
  onChange: (actions: ActionItem[]) => void;
}

export function ActionsList({ actions, onChange }: ActionsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground">Actions</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange([
              ...actions,
              { id: crypto.randomUUID(), description: "", deadline: undefined },
            ])
          }
        >
          <Plus className="size-4" />
          Add action
        </Button>
      </div>
      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No follow-up actions yet.</p>
      ) : null}
      {actions.map((action, i) => (
        <div key={action.id} className="space-y-3 rounded-xl border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
            <div className="flex items-center gap-1">
              <VoiceRecordButton
                onTranscribed={(text) =>
                  onChange(actions.map((a, idx) => (idx === i ? { ...a, description: text } : a)))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                aria-label="Remove action"
                onClick={() => onChange(actions.filter((_, idx) => idx !== i))}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <Textarea
            value={action.description ?? ""}
            rows={2}
            placeholder="What needs to happen next?"
            onChange={(e) =>
              onChange(
                actions.map((a, idx) => (idx === i ? { ...a, description: e.target.value } : a)),
              )
            }
            className="bg-card"
          />
          <DateField
            label="Deadline"
            value={action.deadline}
            onChange={(v) =>
              onChange(actions.map((a, idx) => (idx === i ? { ...a, deadline: v } : a)))
            }
          />
        </div>
      ))}
    </div>
  );
}
