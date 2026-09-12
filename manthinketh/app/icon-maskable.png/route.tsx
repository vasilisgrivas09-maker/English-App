import { renderIcon } from "../icons";

export const dynamic = "force-static";

/** Safe zone ~15% ώστε το Android να μπορεί να το κόψει σε οποιοδήποτε σχήμα. */
export function GET() {
  return renderIcon({ size: 512, padding: 76 });
}
