import { describe, expect, test } from "bun:test";
import { emptyContact, type ContactRecord } from "../src/domain/contact.js";
import { mergeContactSides } from "../src/domain/merge-sides.js";

function baseContact(overrides: Partial<ContactRecord> = {}): ContactRecord {
  return { ...emptyContact(), ...overrides };
}

describe("mergeContactSides", () => {
  test("passes through the VLM contact untouched when there is no QR evidence", () => {
    const vlmContact = baseContact({ full_name: "John Smith", company: "Acme" });
    const result = mergeContactSides({
      vlmContact,
      vlmConfidence: { full_name: "high" },
      qrEntries: [],
    });

    expect(result.contact.full_name).toBe("John Smith");
    expect(result.warnings).toEqual([]);
  });

  test("fills a field missing from the visible card using QR evidence, at medium confidence", () => {
    const vlmContact = baseContact({ full_name: "John Smith" });
    const result = mergeContactSides({
      vlmContact,
      vlmConfidence: {},
      qrEntries: [],
      qrContact: { company: "Acme International" },
    });

    expect(result.contact.company).toBe("Acme International");
    expect(result.confidence.company).toBe("medium");
  });

  test("raises confidence to high when the card and QR agree", () => {
    const vlmContact = baseContact({ company: "Acme" });
    const result = mergeContactSides({
      vlmContact,
      vlmConfidence: { company: "medium" },
      qrEntries: [],
      qrContact: { company: "Acme" },
    });

    expect(result.confidence.company).toBe("high");
  });

  test("flags a conflict rather than silently picking a value", () => {
    const vlmContact = baseContact({ company: "Acme Ltd" });
    const result = mergeContactSides({
      vlmContact,
      vlmConfidence: { company: "high" },
      qrEntries: [],
      qrContact: { company: "Acme International" },
    });

    // The printed card's reading is kept as the field value...
    expect(result.contact.company).toBe("Acme Ltd");
    // ...but the conflict is surfaced, not hidden, and confidence is downgraded.
    expect(result.confidence.company).toBe("low");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe("FIELD_CONFLICT");
  });

  test("appends QR-only emails/phones without duplicating ones already on the card", () => {
    const vlmContact = baseContact({
      emails: [{ id: "e1", value: "john@acme.com" }],
    });
    const result = mergeContactSides({
      vlmContact,
      vlmConfidence: {},
      qrEntries: [],
      qrContact: {
        emails: [
          { id: "", value: "john@acme.com" }, // duplicate, should not be appended again
          { id: "", value: "sales@acme.com" }, // new, should be appended
        ],
      },
    });

    expect(result.contact.emails).toHaveLength(2);
    expect(result.contact.emails.map((e) => e.value)).toEqual(["john@acme.com", "sales@acme.com"]);
    expect(result.confidence["emails.1"]).toBe("medium");
  });

  test("never invents fields absent from both sources", () => {
    const result = mergeContactSides({
      vlmContact: baseContact({ full_name: "Jane Doe" }),
      vlmConfidence: { full_name: "high" },
      qrEntries: [],
    });

    expect(result.contact.middle_name).toBeUndefined();
    expect(result.contact.department).toBeUndefined();
    expect(result.contact.phones).toEqual([]);
  });
});
