"use client";

import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./pwa-client.module.css";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const DISMISS_KEY = "future-fit:pwa-install-dismissed-at";
const DISMISS_DAYS = 7;
const DAY_MS = 86_400_000;

export function PwaClient() {
  const [online, setOnline] = useState(true);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA enhancement should never block the application.
      });
    }

    const installHandler = (event: Event) => {
      const installPrompt = event as BeforeInstallPromptEvent;
      installPrompt.preventDefault();

      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
      const stillDismissed =
        Number.isFinite(dismissedAt) &&
        Date.now() - dismissedAt < DISMISS_DAYS * DAY_MS;

      setInstallEvent(installPrompt);
      setShowInstall(!stillDismissed);
    };

    window.addEventListener("beforeinstallprompt", installHandler);

    const installedHandler = () => {
      setInstallEvent(null);
      setShowInstall(false);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      window.removeEventListener("beforeinstallprompt", installHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function install() {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setShowInstall(false);
      setInstallEvent(null);
      localStorage.removeItem(DISMISS_KEY);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowInstall(false);
  }

  return (
    <>
      {!online ? (
        <div className={styles.offline} role="status" aria-live="polite">
          <WifiOff size={16} />
          <span>
            You are offline. Saved assessment answers will sync when your
            connection returns.
          </span>
        </div>
      ) : null}

      {showInstall && installEvent ? (
        <aside
          className={styles.installCard}
          aria-label="Install Future Fit"
        >
          <button
            type="button"
            className={styles.close}
            aria-label="Dismiss install suggestion"
            onClick={dismiss}
          >
            <X size={16} />
          </button>

          <span className={styles.installIcon}>
            <Download size={20} />
          </span>

          <div className={styles.installCopy}>
            <strong>Install Future Fit</strong>
            <span>
              Add Future Fit to your device for a faster app-like experience.
            </span>
          </div>

          <button
            type="button"
            className={styles.installButton}
            onClick={() => void install()}
          >
            Install
          </button>
        </aside>
      ) : null}
    </>
  );
}
