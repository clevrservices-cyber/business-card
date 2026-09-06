import { describe, expect, test } from "bun:test";
import { emptyContact } from "../src/domain/contact.js";
import { isPlausibleEmail, normalizeUrl, validateContact } from "../src/domain/validate.js";

describe("isPlausibleEmail", () => {
  test("accepts a well-formed address", () => {
    expect(isPlausibleEmail("john.smith@acme.com")).toBe(true);
  });

  test("rejects OCR garbage", () => {
    expect(isPlausibleEmail("john.smithAacme.com")).toBe(false);
    expect(isPlausibleEmail("not an email")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  test("adds https:// to a bare domain", () => {
    expect(normalizeUrl("www.acme.com")).toBe("https://www.acme.com/");
  });

  test("keeps an explicit scheme", () => {
    expect(normalizeUrl("http://acme.com")).toBe("http://acme.com/");
  });

  test("returns undefined for unparseable input", () => {
    expect(normalizeUrl("")).toBeUndefined();
    expect(normalizeUrl("not a url at all ///")).toBeUndefined();
  });
});

describe("validateContact", () => {
  test("flags an implausible email with its field path", () => {
    const contact = emptyContact();
    contact.emails = [{ id: "e1", value: "broken@@address" }];

    const warnings = validateContact(contact);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe("EMAIL_IMPLAUSIBLE");
    expect(warnings[0]?.message).toContain("emails.0");
  });

  test("does not reject a non-Western postal address — no address validation at all", () => {
    const contact = emptyContact();
    contact.address = { postal_code: "10120", city: "Bangkok" }; // no country, no street
    expect(validateContact(contact)).toEqual([]);
  });

  test("returns no warnings for a clean contact", () => {
    const contact = emptyContact();
    contact.emails = [{ id: "e1", value: "john@acme.com" }];
    contact.websites = [{ id: "w1", value: "https://acme.com" }];
    expect(validateContact(contact)).toEqual([]);
  });
});
