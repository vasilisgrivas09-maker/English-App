import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Το λογότυπο ζει ως ένα PNG στο public/ και από αυτό παράγονται όλα τα μεγέθη
 * εικονιδίου κατά το build, ώστε να μη χρειάζονται πολλά αρχεία στο repo.
 */
let cachedLogo: string | undefined;

function logoDataUri() {
  if (!cachedLogo) {
    const bytes = readFileSync(join(process.cwd(), "public", "logo.png"));
    cachedLogo = `data:image/png;base64,${bytes.toString("base64")}`;
  }
  return cachedLogo;
}

export function renderIcon({ size, padding = 0 }: { size: number; padding?: number }) {
  const inner = size - padding * 2;
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri()} width={inner} height={inner} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
