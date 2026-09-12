import type { MetadataRoute } from "next";

/** Προσωπική εφαρμογή — δεν θέλουμε index σε μηχανές αναζήτησης. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
