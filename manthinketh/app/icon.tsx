import { readFileSync } from "node:fs";
import { join } from "node:path";

export const size = 32;
export const contentType = "image/png";

/** Favicon από το λογότυπο (μυαλό + δάφνη). */
export default function Icon() {
  const bytes = readFileSync(join(process.cwd(), "public", "icons", "favicon-32.png"));
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
