import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfidenceBadge, resolveConfidence } from "./ConfidenceBadge";
import type { ConfidenceMap, EmailEntry, WebsiteEntry } from "@/types/business-card";

type Entry = EmailEntry | WebsiteEntry;

interface SimpleEntryListProps {
  label: string;
  addLabel: string;
  placeholder: string;
  emptyText: string;
  confidenceKey: string;
  type?: string | undefined;
  entries: Entry[];
  confidence?: ConfidenceMap | undefined;
  onChange: (entries: Entry[]) => void;
}

function SimpleEntryList({
  label,
  addLabel,
  placeholder,
  emptyText,
  confidenceKey,
  type = "text",
  entries,
  confidence,
  onChange,
}: SimpleEntryListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange([...entries, { id: crypto.randomUUID(), value: "" }])}
        >
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>
      {entries.length === 0 ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null}
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex items-center gap-2">
          <Input
            type={type}
            value={entry.value}
            placeholder={placeholder}
            onChange={(e) =>
              onChange(entries.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))
            }
            className="h-11 bg-card"
          />
          <ConfidenceBadge level={resolveConfidence(confidence, `${confidenceKey}.${i}`)} />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 text-muted-foreground"
            aria-label={`Remove ${label}`}
            onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function EmailList(props: {
  emails: EmailEntry[];
  confidence?: ConfidenceMap | undefined;
  onChange: (e: EmailEntry[]) => void;
}) {
  return (
    <SimpleEntryList
      label="Email addresses"
      addLabel="Add email"
      placeholder="name@company.com"
      emptyText="No email addresses detected."
      confidenceKey="emails"
      type="email"
      entries={props.emails}
      confidence={props.confidence}
      onChange={(e) => props.onChange(e as EmailEntry[])}
    />
  );
}

export function WebsiteList(props: {
  websites: WebsiteEntry[];
  confidence?: ConfidenceMap | undefined;
  onChange: (e: WebsiteEntry[]) => void;
}) {
  return (
    <SimpleEntryList
      label="Websites"
      addLabel="Add website"
      placeholder="https://company.com"
      emptyText="No websites detected."
      confidenceKey="websites"
      entries={props.websites}
      confidence={props.confidence}
      onChange={(e) => props.onChange(e as WebsiteEntry[])}
    />
  );
}
