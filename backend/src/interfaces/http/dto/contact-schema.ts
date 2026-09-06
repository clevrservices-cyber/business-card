import { z } from "zod";

const idString = z.string().min(1);

export const contactRecordSchema = z.object({
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  company: z.string().optional(),
  tagline: z.string().optional(),
  emails: z.array(z.object({ id: idString, value: z.string(), label: z.string().optional() })),
  phones: z.array(
    z.object({
      id: idString,
      value: z.string(),
      type: z.enum(["mobile", "direct", "office", "home", "fax", "other"]),
      normalized: z.string().optional(),
      label: z.string().optional(),
    }),
  ),
  websites: z.array(z.object({ id: idString, value: z.string(), label: z.string().optional() })),
  address: z.object({
    street: z.string().optional(),
    building: z.string().optional(),
    suite: z.string().optional(),
    floor: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }),
  social_links: z.array(
    z.object({
      id: idString,
      platform: z.enum(["linkedin", "x", "facebook", "instagram", "github", "other"]),
      value: z.string(),
    }),
  ),
  qr_codes: z.array(
    z.object({
      id: idString,
      format: z.string().optional(),
      detected: z.boolean(),
      content: z.string().optional(),
      side: z.enum(["front", "back"]).optional(),
    }),
  ),
  notes: z.string().optional(),
});

export const confirmContactSchema = z.object({
  contact: contactRecordSchema,
  front_image: z.string().optional(),
  back_image: z.string().optional(),
  scan_id: z.string().uuid().optional(),
});
