import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { Providers } from "@/components/providers";
import "./styles.css";

const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "Future Fit", template: "%s | Future Fit" },
  description:
    "Scientific career assessments and guidance for Indian students.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#173B57" };

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={nunito.variable}>
        <AuthBootstrap />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
