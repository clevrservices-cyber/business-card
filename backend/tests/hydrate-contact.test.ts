import { describe, expect, test } from "bun:test";

import { hydrateContact } from "../src/infrastructure/ai/hydrate-contact.js";

describe("hydrateContact", () => {
  test("defaults an out-of-enum social platform to linkedin, not the removed 'other' value", () => {
    const contact = hydrateContact({
      social_links: [{ platform: "github", value: "https://github.com/example" }],
    });

    expect(contact.social_links[0]?.platform).toBe("linkedin");
  });

  test("passes through a valid platform from the current enum untouched", () => {
    const contact = hydrateContact({
      social_links: [{ platform: "whatsapp", value: "+1 555 0100" }],
    });

    expect(contact.social_links[0]?.platform).toBe("whatsapp");
  });

  test("initializes tags and actions as empty arrays", () => {
    const contact = hydrateContact({});
    expect(contact.tags).toEqual([]);
    expect(contact.actions).toEqual([]);
  });
});
