/**
 * Παράγει favicon + PWA icons από το logo.png.
 * Μαύρο φόντο του αρχείου → διάφανο, μετά σύνθεση ώστε να φαίνεται
 * καθαρά το μυαλό + η χρυσή δάφνη (όχι μαύρο τετράγωνο).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = join(process.cwd());
const LOGO = join(ROOT, "public", "logo.png");
const OUT = join(ROOT, "public", "icons");

const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };
/** Maskable: γεμάτο brand πράσινο ώστε το Android crop να μην αφήνει κενό. */
const BRAND = { r: 15, g: 81, b: 50, alpha: 1 };

async function logoOnTransparent(): Promise<Buffer> {
  const { data, info } = await sharp(LOGO).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;
    if (r < 28 && g < 28 && b < 28) {
      pixels[i + 3] = 0;
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function makeIcon(
  size: number,
  paddingRatio: number,
  background: { r: number; g: number; b: number; alpha: number },
): Promise<Buffer> {
  const mark = await logoOnTransparent();
  const pad = Math.round(size * paddingRatio);
  const inner = Math.max(1, size - pad * 2);

  const scaled = await sharp(mark)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: scaled, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const files: {
    name: string;
    size: number;
    pad: number;
    background: { r: number; g: number; b: number; alpha: number };
  }[] = [
    { name: "favicon-32.png", size: 32, pad: 0.04, background: BLACK },
    { name: "icon-180.png", size: 180, pad: 0.06, background: BLACK },
    { name: "icon-192.png", size: 192, pad: 0.06, background: BLACK },
    { name: "icon-512.png", size: 512, pad: 0.06, background: BLACK },
    { name: "icon-maskable.png", size: 512, pad: 0.18, background: BRAND },
  ];

  for (const file of files) {
    const buffer = await makeIcon(file.size, file.pad, file.background);
    writeFileSync(join(OUT, file.name), buffer);
    console.log(`wrote icons/${file.name}`);
  }

  writeFileSync(join(OUT, "logo-mark.png"), await logoOnTransparent());
  console.log("wrote icons/logo-mark.png");

  // Apple touch icon στο App Router (στατικό αρχείο).
  writeFileSync(join(ROOT, "app", "apple-icon.png"), await makeIcon(180, 0.06, BLACK));
  console.log("wrote app/apple-icon.png");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
