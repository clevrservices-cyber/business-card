import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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

interface CreatableTagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  fetchOptions: (query?: string) => Promise<string[]>;
  placeholder?: string;
}

export function CreatableTagInput({
  label,
  values,
  onChange,
  fetchOptions,
  placeholder = "Add a tag...",
}: CreatableTagInputProps) {
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

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...values, trimmed]);
    setQuery("");
  };

  const selectable = options.filter(
    (o) => !values.some((v) => v.toLowerCase() === o.toLowerCase()),
  );
  const exactMatch = selectable.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 py-1">
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(values.filter((v) => v !== tag))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
              <Plus className="size-3.5" />
              {values.length === 0 ? placeholder : "Add tag"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search or create..."
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                <CommandEmpty>No matches.</CommandEmpty>
                <CommandGroup>
                  {selectable.map((option) => (
                    <CommandItem key={option} value={option} onSelect={() => addTag(option)}>
                      {option}
                    </CommandItem>
                  ))}
                  {query.trim() && !exactMatch ? (
                    <CommandItem value={`__create__${query}`} onSelect={() => addTag(query)}>
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
    </div>
  );
}
