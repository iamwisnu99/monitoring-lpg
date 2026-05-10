import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://monitoring-lpg.netlify.app";
const APP_NAME = "Monitoring Distribusi LPG 3Kg";
const APP_DESCRIPTION =
  "Sistem pencatatan dan monitoring distribusi LPG 3Kg untuk agen dan pangkalan. Kelola pangkalan, catat distribusi, dan pantau aktivitas secara real-time.";

export const metadata: Metadata = {
  // ── Dasar ──────────────────────────────────────────────────────────────
  title: {
    default: APP_NAME,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: "Monitoring LPG" }],
  keywords: [
    "monitoring LPG",
    "distribusi LPG 3kg",
    "agen LPG",
    "pangkalan LPG",
    "sistem distribusi",
    "monitoring agen",
  ],
  creator: "Monitoring LPG",
  publisher: "Monitoring LPG",

  // ── Canonical & Robots ─────────────────────────────────────────────────
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Favicon & Icons ────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
        color: "#1e40af",
      },
    ],
  },

  // ── Web App Manifest ───────────────────────────────────────────────────
  manifest: "/site.webmanifest",

  // ── Open Graph (WhatsApp, Facebook, Telegram, LinkedIn) ───────────────
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Monitoring Distribusi LPG 3Kg — Sistem pencatatan dan monitoring distribusi",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },

  // ── PWA / Browser Color ────────────────────────────────────────────────
  other: {
    "msapplication-TileColor": "#1e40af",
    "msapplication-config": "/browserconfig.xml",
  },
};

// Viewport terpisah dari metadata (Next.js 14+)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e40af" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a8a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

