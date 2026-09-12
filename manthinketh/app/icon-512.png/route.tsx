import { iconFile } from "../icons";

export const dynamic = "force-static";

export function GET() {
  return iconFile("icon-512.png");
}
