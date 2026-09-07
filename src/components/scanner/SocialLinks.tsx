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
import type { ConfidenceMap, SocialLink, SocialPlatform } from "@/types/business-card";

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "skype", label: "Skype" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "wechat", label: "WeChat" },
  { value: "telegram", label: "Telegram" },
];

export function SocialLinks({
  links,
  confidence,
  onChange,
}: {
  links: SocialLink[];
  confidence?: ConfidenceMap | undefined;
  onChange: (l: SocialLink[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground">Socials</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange([...links, { id: crypto.randomUUID(), platform: "linkedin", value: "" }])
          }
        >
          <Plus className="size-4" />
          Add link
        </Button>
      </div>
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">No social profiles detected.</p>
      ) : null}
      {links.map((link, i) => (
        <div key={link.id} className="flex items-center gap-2">
          <Select
            value={link.platform}
            onValueChange={(v) =>
              onChange(
                links.map((l, idx) => (idx === i ? { ...l, platform: v as SocialPlatform } : l)),
              )
            }
          >
            <SelectTrigger className="h-11 w-[132px] shrink-0 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={link.value}
            placeholder="profile URL or handle"
            onChange={(e) =>
              onChange(links.map((l, idx) => (idx === i ? { ...l, value: e.target.value } : l)))
            }
            className="h-11 bg-card"
          />
          <ConfidenceBadge level={resolveConfidence(confidence, `social_links.${i}`)} />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 text-muted-foreground"
            aria-label="Remove link"
            onClick={() => onChange(links.filter((_, idx) => idx !== i))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
