import { renderIcon } from "../icons";

export const dynamic = "force-static";

export function GET() {
  return renderIcon({ size: 512, padding: 0 });
}
