import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { ConfidenceLevel } from "@/types/business-card";

interface ContactFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  confidence?: ConfidenceLevel;
  type?: string;
  action?: ReactNode;
}

export function ContactField({
  label,
  value,
  onChange,
  placeholder,
  confidence,
  type = "text",
  action,
}: ContactFieldProps) {
  const id = `field-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
          {label}
        </Label>
        <span className="flex items-center gap-1">
          <ConfidenceBadge level={confidence} />
          {action}
        </span>
      </div>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 bg-card"
      />
    </div>
  );
}
