import { ArrowLeft, Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ASSETS } from "@/config/assets";
import styles from "@/styles/system.module.css";

export default function NotFound() {
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
          <Compass size={27} />
        </span>

        <h1>This path does not exist.</h1>
        <p>
          The page may have moved, the link may be incomplete, or this route is
          not available yet.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>
            <ArrowLeft size={15} />
            Back to Future Fit
          </Link>
        </div>
      </section>
    </main>
  );
}
