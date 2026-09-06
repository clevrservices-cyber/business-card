/**
 * BACKEND INTEGRATION POINT
 * -------------------------
 * `scanBusinessCard` is the single boundary between this frontend and the
 * future backend. Replace the mock body with a real HTTP call (multipart
 * upload of the two images) that resolves to `ScanResult` or rejects with a
 * `ScanApiError`. Nothing else in the UI needs to change.
 */

import type { ScanError, ScanErrorCode, ScanResult } from "@/types/business-card";

export class ScanApiError extends Error {
  code: ScanErrorCode;
  partial?: ScanResult | undefined;

  constructor(error: ScanError) {
    super(error.message);
    this.name = "ScanApiError";
    this.code = error.code;
    this.partial = error.partial;
  }
}

const id = () => Math.random().toString(36).slice(2, 10);

function mockResult(frontUrl: string, backUrl?: string): ScanResult {
  return {
    front_image: frontUrl,
    back_image: backUrl,
    contact: {
      first_name: "Anong",
      middle_name: "",
      last_name: "Srisuk",
      full_name: "Anong Srisuk",
      job_title: "Head of Partnerships",
      department: "Commercial",
      company: "Northbridge Robotics",
      tagline: "Automation for precision manufacturing",
      emails: [
        { id: id(), value: "anong.s@northbridge-robotics.com", label: "Work" },
        { id: id(), value: "partnerships@northbridge-robotics.com", label: "Team" },
      ],
      phones: [
        { id: id(), type: "mobile", value: "+66 81 234 5678" },
        { id: id(), type: "office", value: "+66 2 015 4400" },
        { id: id(), type: "fax", value: "+66 2 015 4401" },
      ],
      websites: [{ id: id(), value: "https://northbridge-robotics.com" }],
      address: {
        street: "88 Sathorn Road",
        building: "Empire Tower",
        suite: "Suite 2204",
        floor: "22",
        city: "Bangkok",
        state: "Bangkok",
        postal_code: "10120",
        country: "Thailand",
      },
      social_links: [
        { id: id(), platform: "linkedin", value: "linkedin.com/in/anongsrisuk" },
        { id: id(), platform: "x", value: "@northbridgerobo" },
      ],
      qr_codes: backUrl
        ? [
            {
              id: id(),
              format: "qr",
              detected: true,
              side: "back",
              content: "https://northbridge-robotics.com/vcard/anong",
            },
          ]
        : [],
      notes: "Met at Automation Expo — follow up on pilot programme in Q4.",
    },
    confidence: {
      full_name: "high",
      first_name: "high",
      last_name: "high",
      job_title: "high",
      department: "medium",
      company: "high",
      tagline: "medium",
      "emails.0": "high",
      "emails.1": "medium",
      "phones.0": "low",
      "phones.1": "high",
      "phones.2": "medium",
      "websites.0": "high",
      "address.street": "medium",
      "address.postal_code": "low",
      "address.city": "high",
      "address.country": "high",
      "social_links.0": "high",
      "social_links.1": "medium",
      notes: "low",
    },
    warnings: [
      { code: "PARTIAL_RESULT", message: "Some phone digits were hard to read — please review." },
    ],
  };
}

export interface ScanBusinessCardOptions {
  signal?: AbortSignal | undefined;
}

/**
 * Sends the captured card images for extraction.
 *
 * TODO(backend): replace with e.g.
 *   const body = new FormData();
 *   body.append("front", frontImage);
 *   if (backImage) body.append("back", backImage);
 *   const res = await fetch("/api/scan", { method: "POST", body, signal });
 *   if (!res.ok) throw new ScanApiError(await res.json());
 *   return (await res.json()) as ScanResult;
 */
export async function scanBusinessCard(
  frontImage: File,
  backImage?: File,
  _options: ScanBusinessCardOptions = {},
): Promise<ScanResult> {
  await new Promise((r) => setTimeout(r, 4200)) | undefined;

  const frontUrl = URL.createObjectURL(frontImage);
  const backUrl = backImage ? URL.createObjectURL(backImage) : undefined;
  return mockResult(frontUrl, backUrl);
}

/**
 * Final hand-off of the reviewed contact. Currently a no-op placeholder.
 * TODO(backend): POST the confirmed contact object.
 */
export async function confirmContact(contact: unknown): Promise<void> {
  console.info("[scan-api] confirmContact payload", contact);
  await new Promise((r) => setTimeout(r, 600));
}
