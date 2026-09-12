import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "As a Man Thinketh — Βιβλίο Ασκήσεων",
    short_name: "ManThinketh",
    description:
      "250 λέξεις, 12 δομημένα μαθήματα και spaced repetition. Δουλεύει offline, η πρόοδος μένει στη συσκευή σου.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#0f5132",
    lang: "el",
    dir: "ltr",
    categories: ["education", "books"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
