import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import type { ContactRecord } from "./contact.js";

/**
 * Covers the countries named in the spec's multilingual list plus common
 * neighbours. Deliberately not exhaustive — a number printed with its own "+"
 * country code (the common case on an international business card) parses
 * without needing this at all; the hint only helps local-format numbers.
 */
const COUNTRY_NAME_TO_ISO: Record<string, CountryCode> = {
  thailand: "TH",
  netherlands: "NL",
  "the netherlands": "NL",
  belgium: "BE",
  france: "FR",
  china: "CN",
  germany: "DE",
  spain: "ES",
  japan: "JP",
  "south korea": "KR",
  korea: "KR",
  "united states": "US",
  usa: "US",
  "united kingdom": "GB",
  uk: "GB",
  singapore: "SG",
  "hong kong": "HK",
  taiwan: "TW",
  vietnam: "VN",
  malaysia: "MY",
  indonesia: "ID",
  australia: "AU",
  canada: "CA",
  italy: "IT",
  switzerland: "CH",
};

function countryHintFrom(name: string | undefined): CountryCode | undefined {
  if (!name) return undefined;
  return COUNTRY_NAME_TO_ISO[name.trim().toLowerCase()];
}

/**
 * Normalizes to E.164 where parseable. The original displayed string is
 * never touched — only `normalized` is added alongside it (spec: never
 * destroy the card's own formatting).
 */
export function normalizePhoneNumber(raw: string, countryHint?: string): string | undefined {
  const parsed = parsePhoneNumberFromString(raw, countryHintFrom(countryHint));
  return parsed?.isValid() ? parsed.number : undefined;
}

export function normalizeContactPhones(contact: ContactRecord): ContactRecord {
  const countryHint = contact.address.country;
  return {
    ...contact,
    phones: contact.phones.map((phone) => ({
      ...phone,
      normalized: normalizePhoneNumber(phone.value, countryHint) ?? phone.normalized,
    })),
  };
}
