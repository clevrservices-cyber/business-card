import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfidenceBadge, resolveConfidence } from "./ConfidenceBadge";
import type { ConfidenceMap, PhoneEntry, PhoneType } from "@/types/business-card";

const TYPES: PhoneType[] = ["mobile", "direct", "office", "home", "fax", "other"];

interface PhoneListProps {
  phones: PhoneEntry[];
  confidence?: ConfidenceMap;
  onChange: (phones: PhoneEntry[]) => void;
}

export function PhoneList({ phones, confidence, onChange }: PhoneListProps) {
  const update = (i: number, patch: Partial<PhoneEntry>) =>
    onChange(phones.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground">Phone numbers</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange([
              ...phones,
              { id: crypto.randomUUID(), type: "mobile", value: "" },
            ])
          }
        >
          <Plus className="size-4" />
          Add phone
        </Button>
      </div>
      {phones.length === 0 ? (
        <p className="text-sm text-muted-foreground">No phone numbers detected.</p>
      ) : null}
      {phones.map((phone, i) => (
        <div key={phone.id} className="flex items-center gap-2">
          <Select value={phone.type} onValueChange={(v) => update(i, { type: v as PhoneType })}>
            <SelectTrigger className="h-11 w-[112px] shrink-0 bg-card capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={phone.value}
            inputMode="tel"
            placeholder="+66 ..."
            onChange={(e) => update(i, { value: e.target.value })}
            className="h-11 bg-card"
          />
          <ConfidenceBadge level={resolveConfidence(confidence, `phones.${i}`)} />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 text-muted-foreground"
            aria-label="Remove phone"
            onClick={() => onChange(phones.filter((_, idx) => idx !== i))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
