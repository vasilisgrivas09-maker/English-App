import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "greek"],
  variable: "--font-inter",
  display: "swap",
});

// Χρησιμοποιείται μόνο στον τίτλο του βιβλίου, γι' αυτό μόνο ένα βάρος σε italic.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "As a Man Thinketh — Βιβλίο Ασκήσεων",
  description:
    "Μάθε τις 250 λέξεις του «As a Man Thinketh» με 12 δομημένα μαθήματα και spaced repetition. Η πρόοδος αποθηκεύεται τοπικά στη συσκευή σου.",
  applicationName: "ManThinketh",
  manifest: "/manifest.webmanifest",
  // Προσωπική εφαρμογή: δεν θέλουμε να εμφανίζεται σε μηχανές αναζήτησης.
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: {
    capable: true,
    title: "ManThinketh",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f5132" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

/** Τρέχει πριν το paint ώστε το dark mode να μην αναβοσβήνει. */
const themeScript = `(function(){try{var s=localStorage.getItem("amt_theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} bg-paper text-zinc-900 antialiased dark:bg-ink dark:text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
