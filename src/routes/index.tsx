import { createFileRoute } from "@tanstack/react-router";
import { BusinessCardScanner } from "@/components/scanner/BusinessCardScanner";

const title = "Scan Business Card — Instant Contact Capture";
const description =
  "Photograph or upload a business card, review the extracted contact details, edit anything that needs a fix, and confirm.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: BusinessCardScanner,
});
