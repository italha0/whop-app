import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { WhopProvider } from "@/hooks/useWhopAuth";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Define the site's URL. Fallback to localhost for development.
// IMPORTANT: Create a .env.local file and set NEXT_PUBLIC_SITE_URL to your production domain.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// --- COMPREHENSIVE SEO METADATA ---
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Script to Video: AI-Powered Video Creation',
    template: `%s | Script to Video`,
  },
  description: 'Turn your text scripts into engaging videos with AI. Create, customize, and download videos for social media and more. Fast, easy, and free to start.',
  keywords: [
    'script to video',
    'text to video',
    'AI video generator',
    'video creation',
    'content repurposing',
    'social media video',
    'video marketing',
    'free video maker',
  ],
  
  // SEO fundamentals
  applicationName: 'Script to Video',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  
  // Social media sharing (Open Graph & Twitter)
  openGraph: {
    title: 'Script to Video: AI-Powered Video Creation',
    description: 'Turn your text scripts into engaging videos with AI. Create, customize, and download videos for social media and more.',
    url: siteUrl,
    siteName: 'Script to Video',
    images: [
      {
        url: '/og-image.png', // Ensure this image exists in your /public folder
        width: 1200,
        height: 630,
        alt: 'AI-powered script to video creation platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Script to Video: AI-Powered Video Creation',
    description: 'Turn your text scripts into engaging videos with AI.',
    images: [`${siteUrl}/twitter-image.png`], // Ensure this image exists
  },

  // Icons and manifest
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest', // Ensure this file exists in /public

  // Other metadata
  other: {
    'google-adsense-account': 'ca-pub-2892825507816139',
  },
};

// --- WEB APPLICATION STRUCTURED DATA (JSON-LD) ---
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Script to Video',
  description: 'An AI-powered platform to convert text scripts into engaging videos.',
  url: siteUrl,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any', // Web-based application
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    "AI-powered video generation from text",
    "Customizable video styles and themes",
    "Voiceover generation",
    "Social media format exports",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <Script
          id="app-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Google Analytics */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
        <meta name="google-site-verification" content="qf15QRFUFM6oxJRs_YssAEM563O3XhDdTMyrhYU25-Q" />
        <meta name="google-adsense-account" content="ca-pub-2892825507816139" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <WhopProvider>
            <Suspense fallback={null}>{children}</Suspense>
          </WhopProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}