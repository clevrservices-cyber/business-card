import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { ConfidenceLevel } from "@/types/business-card";

interface CreatableComboboxProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  fetchOptions: (query?: string) => Promise<string[]>;
  placeholder?: string;
  confidence?: ConfidenceLevel | undefined;
}

export function CreatableCombobox({
  label,
  value,
  onChange,
  fetchOptions,
  placeholder = "Type to search or create...",
  confidence,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchOptions(query)
        .then((items) => {
          if (!cancelled) setOptions(items);
        })
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, fetchOptions]);

  const exactMatch = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
        <ConfidenceBadge level={confidence} />
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between bg-card font-normal",
              !value && "text-muted-foreground",
            )}
          >
            {value || placeholder}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("size-4", value === option ? "opacity-100" : "opacity-0")}
                    />
                    {option}
                  </CommandItem>
                ))}
                {query.trim() && !exactMatch ? (
                  <CommandItem
                    value={`__create__${query}`}
                    onSelect={() => {
                      onChange(query.trim());
                      setOpen(false);
                    }}
                  >
                    <Plus className="size-4" />
                    Create &quot;{query.trim()}&quot;
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
