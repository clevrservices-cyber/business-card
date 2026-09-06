import { Building2, CheckCircle2, MapPin, QrCode, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AddressForm } from "./AddressForm";
import { ConfidenceBadge, resolveConfidence } from "./ConfidenceBadge";
import { ContactField } from "./ContactField";
import { EmailList, WebsiteList } from "./SimpleEntryList";
import { OriginalCardViewer } from "./OriginalCardViewer";
import { PhoneList } from "./PhoneList";
import { SocialLinks } from "./SocialLinks";
import type { ContactData, ScanResult } from "@/types/business-card";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wide">
        <Icon className="size-4 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}

interface ContactResultsProps {
  result: ScanResult;
  onConfirm: (contact: ContactData) => void;
  onStartOver: () => void;
  confirming?: boolean | undefined;
}

export function ContactResults({
  result,
  onConfirm,
  onStartOver,
  confirming,
}: ContactResultsProps) {
  const [contact, setContact] = useState<ContactData>(result.contact);
  const conf = result.confidence;
  const set = <K extends keyof ContactData>(key: K, value: ContactData[K]) =>
    setContact((c) => ({ ...c, [key]: value }));

  return (
    <div className="space-y-5 pb-28">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Extracted contact</h1>
          <p className="text-sm text-muted-foreground">
            Review and edit the details before confirming.
          </p>
        </div>
        <OriginalCardViewer front={result.front_image} back={result.back_image} />
      </header>

      {result.warnings?.length ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          {result.warnings.map((w) => (
            <p key={w.code}>{w.message}</p>
          ))}
        </div>
      ) : null}

      <Section icon={User} title="Person">
        <div className="grid gap-4 sm:grid-cols-2">
          <ContactField
            label="First name"
            value={contact.first_name ?? ""}
            confidence={resolveConfidence(conf, "first_name")}
            onChange={(v) => set("first_name", v)}
          />
          <ContactField
            label="Middle name"
            value={contact.middle_name ?? ""}
            confidence={resolveConfidence(conf, "middle_name")}
            onChange={(v) => set("middle_name", v)}
          />
          <ContactField
            label="Last name"
            value={contact.last_name ?? ""}
            confidence={resolveConfidence(conf, "last_name")}
            onChange={(v) => set("last_name", v)}
          />
          <ContactField
            label="Full name"
            value={contact.full_name ?? ""}
            confidence={resolveConfidence(conf, "full_name")}
            onChange={(v) => set("full_name", v)}
          />
          <ContactField
            label="Job title"
            value={contact.job_title ?? ""}
            confidence={resolveConfidence(conf, "job_title")}
            onChange={(v) => set("job_title", v)}
          />
          <ContactField
            label="Department"
            value={contact.department ?? ""}
            confidence={resolveConfidence(conf, "department")}
            onChange={(v) => set("department", v)}
          />
        </div>
      </Section>

      <Section icon={Building2} title="Company">
        <div className="grid gap-4 sm:grid-cols-2">
          <ContactField
            label="Company name"
            value={contact.company ?? ""}
            confidence={resolveConfidence(conf, "company")}
            onChange={(v) => set("company", v)}
          />
          <ContactField
            label="Tagline"
            value={contact.tagline ?? ""}
            confidence={resolveConfidence(conf, "tagline")}
            onChange={(v) => set("tagline", v)}
          />
        </div>
        <Separator className="my-5" />
        <div className="space-y-5">
          <PhoneList
            phones={contact.phones}
            confidence={conf}
            onChange={(p) => set("phones", p)}
          />
          <EmailList
            emails={contact.emails}
            confidence={conf}
            onChange={(e) => set("emails", e)}
          />
          <WebsiteList
            websites={contact.websites}
            confidence={conf}
            onChange={(w) => set("websites", w)}
          />
        </div>
      </Section>

      <Section icon={MapPin} title="Address">
        <AddressForm
          address={contact.address}
          confidence={conf}
          onChange={(a) => set("address", a)}
        />
      </Section>

      <Section icon={Sparkles} title="Online & social">
        <SocialLinks
          links={contact.social_links}
          confidence={conf}
          onChange={(l) => set("social_links", l)}
        />
      </Section>

      <Section icon={QrCode} title="QR / Barcode">
        {contact.qr_codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No QR code or barcode detected.</p>
        ) : (
          <ul className="space-y-3">
            {contact.qr_codes.map((qr) => (
              <li key={qr.id} className="rounded-xl border bg-surface p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase">
                    {qr.format ?? "code"} detected{qr.side ? ` on ${qr.side}` : ""}
                  </span>
                  <ConfidenceBadge level={qr.detected ? "high" : "low"} />
                </div>
                <p className="mt-1 break-all text-muted-foreground">
                  {qr.content ?? "Content could not be decoded."}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={CheckCircle2} title="Notes">
        <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
          Additional extracted text
        </Label>
        <Textarea
          value={contact.notes ?? ""}
          rows={3}
          onChange={(e) => set("notes", e.target.value)}
          className="bg-card"
        />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button variant="outline" size="lg" className="h-12" onClick={onStartOver}>
            Start over
          </Button>
          <Button
            size="lg"
            className="h-12 flex-1"
            disabled={confirming}
            onClick={() => onConfirm(contact)}
          >
            <CheckCircle2 className="size-5" />
            {confirming ? "Confirming..." : "Confirm Contact"}
          </Button>
        </div>
      </div>
    </div>
  );
}
