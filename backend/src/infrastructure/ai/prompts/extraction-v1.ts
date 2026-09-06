/**
 * Versioned extraction prompt (v1). Bump the filename/export name (extraction-v2.ts,
 * EXTRACTION_PROMPT_V2) rather than editing this in place, so a provider can be
 * pinned to a known-good version while a new one is evaluated.
 */
export const EXTRACTION_PROMPT_V1 = `You are an expert business-card information extraction system.

Analyze the supplied business card image(s). Extract ONLY information that is visibly present.
Do not hallucinate missing information — if a field is not present or not legible, omit it
(for scalar fields) or leave its array empty. Never invent a middle name, phone number, email,
department, or country that is not actually printed on the card.

Determine which text represents:
- person (first/middle/last/full name, any suffix)
- company and company tagline
- job title and department
- phone numbers — and for each, whether it is mobile, direct, office, home, or fax based on any
  label printed next to it (e.g. "M:", "T:", "F:", "Direct"); use "other" only when genuinely
  undeterminable
- email addresses
- websites
- postal address (street, building, suite, floor, city, state/province, postal code, country) —
  follow the card's own local format; do not force it into a Western template
- social media handles/URLs (LinkedIn, X/Twitter, Facebook, Instagram, GitHub, other)
- any other printed text worth keeping as a note

Preserve names, company names, URLs, phone numbers and addresses EXACTLY as printed — do not
reformat, translate, or "correct" them. The card may use any language or script; extract it as
written and do not translate names or company names.

If a front and a back image are both supplied, they are two sides of the SAME business card —
combine them into one contact, not two.

If text is ambiguous or hard to read (e.g. could be "John Smith" or "John Smlth"), extract your
best reading and reflect the uncertainty with a lower confidence score rather than silently
picking one reading with false confidence.

Call the return_contact tool exactly once with the extracted contact and a confidence map. The
confidence map is keyed by field path (e.g. "full_name", "phones.0", "address.city") and every
key must be "high", "medium", or "low" — reflecting your actual certainty, not a default.`;

export const CONTACT_TOOL_NAME = "return_contact";

/**
 * JSON schema for the tool-use call — mirrors ContactRecord/ConfidenceMap
 * (backend/src/domain/contact.ts) field-for-field. Using tool-use rather than
 * prose parsing means the model can't return malformed JSON.
 */
export const CONTACT_TOOL_SCHEMA = {
  name: CONTACT_TOOL_NAME,
  description: "Return the extracted business card contact and per-field confidence.",
  input_schema: {
    type: "object",
    properties: {
      contact: {
        type: "object",
        properties: {
          first_name: { type: "string" },
          middle_name: { type: "string" },
          last_name: { type: "string" },
          full_name: { type: "string" },
          job_title: { type: "string" },
          department: { type: "string" },
          company: { type: "string" },
          tagline: { type: "string" },
          emails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                value: { type: "string" },
                label: { type: "string", enum: ["work", "personal", "other"] },
              },
              required: ["value"],
            },
          },
          phones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                value: { type: "string" },
                type: {
                  type: "string",
                  enum: ["mobile", "direct", "office", "home", "fax", "other"],
                },
              },
              required: ["value", "type"],
            },
          },
          websites: {
            type: "array",
            items: {
              type: "object",
              properties: { value: { type: "string" } },
              required: ["value"],
            },
          },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              building: { type: "string" },
              suite: { type: "string" },
              floor: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              postal_code: { type: "string" },
              country: { type: "string" },
            },
          },
          social_links: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: {
                  type: "string",
                  enum: ["linkedin", "x", "facebook", "instagram", "github", "other"],
                },
                value: { type: "string" },
              },
              required: ["platform", "value"],
            },
          },
          notes: { type: "string" },
        },
      },
      confidence: {
        type: "object",
        description: 'Field path -> "high" | "medium" | "low"',
        additionalProperties: { type: "string", enum: ["high", "medium", "low"] },
      },
    },
    required: ["contact", "confidence"],
  },
} as const;
