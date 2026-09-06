import type { ContactRecord } from "../../domain/contact.js";

function unescapeVCard(value: string): string {
  return value.replace(/\\n/gi, " ").replace(/\\(.)/g, "$1");
}

/** Splits "TEL;TYPE=CELL:+66..." into { name: "TEL", params: ["TYPE=CELL"], value: "+66..." }. */
function parseLine(line: string): { name: string; params: string[]; value: string } | undefined {
  const colon = line.indexOf(":");
  if (colon === -1) return undefined;
  const [name, ...params] = line.slice(0, colon).split(";");
  return { name: (name ?? "").toUpperCase(), params, value: unescapeVCard(line.slice(colon + 1)) };
}

/**
 * A small, deliberately partial vCard 3.0/4.0 reader — just the fields this
 * pipeline uses as corroborating evidence (FN, N, ORG, TITLE, TEL, EMAIL, URL,
 * ADR). Not a general-purpose vCard library; a QR code's payload is small and
 * this covers what real business-card vCards actually contain.
 */
export function parseVCard(raw: string): Partial<ContactRecord> | undefined {
  if (!/BEGIN:VCARD/i.test(raw)) return undefined;

  // Unfold continuation lines (a line starting with a space/tab continues the previous one).
  const unfolded = raw.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
  const lines = unfolded.split("\n").map((l) => l.trim()).filter(Boolean);

  const contact: Partial<ContactRecord> = {};
  const emails: NonNullable<ContactRecord["emails"]> = [];
  const phones: NonNullable<ContactRecord["phones"]> = [];
  const websites: NonNullable<ContactRecord["websites"]> = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const { name, params, value } = parsed;

    switch (name) {
      case "FN":
        contact.full_name = value;
        break;
      case "N": {
        const [last, first, middle] = value.split(";");
        if (last) contact.last_name = last;
        if (first) contact.first_name = first;
        if (middle) contact.middle_name = middle;
        break;
      }
      case "ORG":
        contact.company = value.split(";")[0];
        break;
      case "TITLE":
        contact.job_title = value;
        break;
      case "TEL": {
        const typeParam = params.find((p) => p.toUpperCase().startsWith("TYPE="));
        const rawType = typeParam?.split("=")[1]?.split(",")[0]?.toLowerCase();
        const type = rawType === "cell" ? "mobile" : rawType === "work" ? "office" : rawType === "fax" ? "fax" : rawType === "home" ? "home" : "other";
        phones.push({ id: "", value, type: type as ContactRecord["phones"][number]["type"] });
        break;
      }
      case "EMAIL":
        emails.push({ id: "", value });
        break;
      case "URL":
        websites.push({ id: "", value });
        break;
      case "ADR": {
        const [, , street, city, state, postalCode, country] = value.split(";");
        contact.address = {
          street: street || undefined,
          city: city || undefined,
          state: state || undefined,
          postal_code: postalCode || undefined,
          country: country || undefined,
        };
        break;
      }
      default:
        break;
    }
  }

  if (emails.length) contact.emails = emails;
  if (phones.length) contact.phones = phones;
  if (websites.length) contact.websites = websites;

  return contact;
}
