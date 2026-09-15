import { WifiOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ASSETS } from "@/config/assets";
import styles from "@/styles/system.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          src={ASSETS.brand.logoPrimary}
          alt="Future Fit"
          width={220}
          height={68}
          className={styles.logo}
          priority
        />

        <span className={styles.icon}>
          <WifiOff size={27} />
        </span>

        <h1>You are offline.</h1>
        <p>
          Reconnect to open a new Future Fit page. If an assessment was already
          open, keep that tab open — local draft answers can sync when your
          connection returns.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>
            Try Future Fit again
          </Link>
        </div>
      </section>
    </main>
  );
}
