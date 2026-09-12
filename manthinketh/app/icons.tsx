import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Σερβίρει τα προ-παραγμένα icons από public/icons (sharp),
 * ώστε favicon και home-screen να δείχνουν σταθερά το λογότυπο.
 */
export function iconFile(name: string): Response {
  const bytes = readFileSync(join(process.cwd(), "public", "icons", name));
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
