"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}
export function BotChallenge({
  action,
  onToken,
}: {
  action: string;
  onToken: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    onToken("");
    if (!ready || !siteKey || !ref.current || !window.turnstile) return;
    const id = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      action,
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
    return () => window.turnstile?.remove(id);
  }, [ready, siteKey, action, onToken]);
  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
      />
      <div ref={ref} />
    </>
  );
}
