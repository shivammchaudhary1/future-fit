import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { Providers } from "@/components/providers";
import { ASSETS } from "@/config/assets";

import "@/styles/theme.css";
import "./styles.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Future Fit",
    template: "%s | Future Fit",
  },

  description:
    "Personalized career assessments and guidance for Indian students.",

  manifest: "/manifest.webmanifest",

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
      </body>
    </html>
  );
}
