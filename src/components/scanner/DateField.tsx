import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { ConfidenceLevel } from "@/types/business-card";

interface DateFieldProps {
  label: string;
  value: string | undefined; // ISO "YYYY-MM-DD"
  onChange: (value: string | undefined) => void;
  confidence?: ConfidenceLevel | undefined;
}

export function DateField({ label, value, onChange, confidence }: DateFieldProps) {
  const parsed = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
        <ConfidenceBadge level={confidence} />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-11 w-full justify-start bg-card font-normal",
              !parsed && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4" />
            {parsed ? format(parsed, "PP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsed}
            onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
