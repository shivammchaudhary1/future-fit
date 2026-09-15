import styles from "@/styles/system.module.css";

export default function Loading() {
  return (
    <main className={styles.loadingPage} aria-busy="true">
      <div className={styles.loadingCard}>
        <span className={styles.spinner} aria-hidden="true" />
        <strong>Loading Future Fit…</strong>
        <span>Preparing the next screen for you.</span>
      </div>
    </main>
  );
}
