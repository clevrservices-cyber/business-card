import { CONTACT_TOOL_NAME, CONTACT_TOOL_SCHEMA } from "./extraction-v1.js";

export const TEXT_EXTRACTION_PROMPT_V1 = `You are extracting business contact information from the
text content of a web page that a QR code on a business card pointed to (e.g. a personal bio page,
a company "contact us"/team page, a LinkedIn-style profile).

Extract ONLY information that is actually present in the text. Do not hallucinate a name, company,
phone number, email, or address that isn't there — if the page is unrelated or has no identifiable
contact details, return empty fields.

This is corroborating evidence for a business card scan, not the primary source — extract
conservatively and only what is clearly stated.

Call the return_contact tool exactly once with whatever fields you can confidently extract and a
confidence map for each populated field ("high", "medium", or "low").`;

export { CONTACT_TOOL_NAME, CONTACT_TOOL_SCHEMA };
