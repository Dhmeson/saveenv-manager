import type React from "react"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  metadataBase: new URL("https://saveenv.vercel.app"),
  title: {
    default: "Saveenv",
    template: "%s | Saveenv",
  },
  description: "Saveenv simplifies secure environment variable management for teams and organizations.",
  keywords: ["environment variables", "security", "encryption", "teams", "DevOps", "variable management", "Saveenv"],
  authors: [{ name: "Saveenv" }],
  creator: "Saveenv",
  applicationName: "Saveenv",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Saveenv",
    siteName: "Saveenv",
    description: "Securely store and share environment variables with your team.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Saveenv Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saveenv",
    description: "Securely store and share environment variables with your team.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        
      </head>
      <body
        className={` antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
