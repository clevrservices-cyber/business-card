import { describe, expect, test } from "bun:test";
import { emptyContact } from "../src/domain/contact.js";
import { normalizeContactPhones, normalizePhoneNumber } from "../src/domain/normalize-phone.js";

describe("normalizePhoneNumber", () => {
  test("parses a number that already carries its own country code", () => {
    expect(normalizePhoneNumber("+66 81 234 5678")).toBe("+66812345678");
  });

  test("uses the country hint for a local-format number", () => {
    expect(normalizePhoneNumber("081 234 5678", "Thailand")).toBe("+66812345678");
  });

  test("returns undefined rather than guessing when unparseable", () => {
    expect(normalizePhoneNumber("not a phone number")).toBeUndefined();
  });
});

describe("normalizeContactPhones", () => {
  test("adds `normalized` alongside the original, never replacing it", () => {
    const contact = emptyContact();
    contact.phones = [{ id: "p1", value: "+66 81 234 5678", type: "mobile" }];

    const result = normalizeContactPhones(contact);
    expect(result.phones[0]?.value).toBe("+66 81 234 5678"); // original formatting preserved
    expect(result.phones[0]?.normalized).toBe("+66812345678");
  });

  test("leaves normalized unset for an unparseable number instead of dropping the entry", () => {
    const contact = emptyContact();
    contact.phones = [{ id: "p1", value: "ask reception", type: "other" }];

    const result = normalizeContactPhones(contact);
    expect(result.phones).toHaveLength(1);
    expect(result.phones[0]?.normalized).toBeUndefined();
  });
});
