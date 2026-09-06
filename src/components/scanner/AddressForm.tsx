import { ContactField } from "./ContactField";
import { resolveConfidence } from "./ConfidenceBadge";
import type { ConfidenceMap, PostalAddress } from "@/types/business-card";

const FIELDS: { key: keyof PostalAddress; label: string }[] = [
  { key: "street", label: "Street" },
  { key: "building", label: "Building" },
  { key: "suite", label: "Suite" },
  { key: "floor", label: "Floor" },
  { key: "city", label: "City" },
  { key: "state", label: "State / Province" },
  { key: "postal_code", label: "Postal code" },
  { key: "country", label: "Country" },
];

export function AddressForm({
  address,
  confidence,
  onChange,
}: {
  address: PostalAddress;
  confidence?: ConfidenceMap;
  onChange: (a: PostalAddress) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map(({ key, label }) => (
        <ContactField
          key={key}
          label={label}
          value={address[key] ?? ""}
          confidence={resolveConfidence(confidence, `address.${key}`)}
          onChange={(v) => onChange({ ...address, [key]: v })}
        />
      ))}
    </div>
  );
}
