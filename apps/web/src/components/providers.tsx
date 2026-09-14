"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { ASSESSMENT_MESSAGES } from "@/config/assessment.constants";
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );
  const user = useAuthStore((state) => state.user);
  const locale = user?.preferredLanguage ?? "en";
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  useEffect(() => {
    client.clear();
  }, [user?.id, client]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        timeZone="Asia/Kolkata"
        locale={locale}
        messages={ASSESSMENT_MESSAGES[locale]}
      >
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
