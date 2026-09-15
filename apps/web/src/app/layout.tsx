import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { Providers } from "@/components/providers";
import { PwaClient } from "@/components/pwa/pwa-client";
import { ASSETS } from "@/config/assets";

import "@/styles/theme.css";
import "@/styles/resilience.css";
import "./styles.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  applicationName: "Future Fit",
  title: {
    default: "Future Fit",
    template: "%s | Future Fit",
  },
  description:
    "Personalized career assessments and guidance for Indian students.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Future Fit",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: ASSETS.brand.favicon16,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: ASSETS.brand.favicon32,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: ASSETS.brand.favicon,
      },
    ],
    apple: ASSETS.brand.appleTouchIcon,
  },
};

export const viewport: Viewport = {
  themeColor: "#173B57",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={nunito.variable}>
        <AuthBootstrap />
        <Providers>{children}</Providers>
        <PwaClient />
      </body>
    </html>
  );
}
