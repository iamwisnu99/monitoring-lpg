import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://monitoring-lpg.netlify.app";
const APP_NAME = "Kemitraan Agen";
const APP_DESCRIPTION = "Aplikasi monitoring distribusi LPG 3Kg untuk agen resmi Pertamina.";

export const metadata: Metadata = {
  // ── Dasar ──────────────────────────────────────────────────────────────
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
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
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Kemitraan Agen - Monitoring Distribusi LPG 3Kg",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────
  twitter: {
    card: "summary",
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: ["/web-app-manifest-512x512.png"],
  },

  // ── PWA / Browser Color ────────────────────────────────────────────────
  other: {
    "msapplication-TileColor": "#1e40af",
    "msapplication-config": "/browserconfig.xml",
  },

  // ── Verifikasi Search Engine ──────────────────────────────────────────
  verification: {
    google: "bVxOlhuVPtiO4w5vyCBVruV5ShhorXFRyj0dGJY95Fw",
  },
};

// Viewport terpisah dari metadata (Next.js 14+)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#009345" },
    { media: "(prefers-color-scheme: dark)", color: "#007a38" },
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
    <html lang="id" className={inter.className}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
