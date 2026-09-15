"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AUTH_LINKS } from "@/config/auth.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/payments.module.css";

interface Product {
  _id: string;
  name: string;
  amount: number;
  currency: string;
  durationDays: number;
  assessmentIds?: string[];
}

interface Payment {
  _id: string;
  productId?: string;
  status: "CREATING" | "CREATED" | "PAID" | "RECONCILIATION_REQUIRED" | string;
  amount: number;
  currency: string;
  durationDays?: number;
  assessmentIds?: string[];
  providerOrderId?: string;
  providerPaymentId?: string;
  paidAt?: string;
  createdAt?: string;
}

interface Checkout {
  open(): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      order_id: string;
      name: string;
      description?: string;
      prefill?: {
        email?: string;
      };
      handler: () => void;
      modal?: {
        ondismiss?: () => void;
      };
      theme?: {
        color?: string;
      };
    }) => Checkout;
  }
}

const navItems = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  { label: "Access & Payments", href: "/payments", icon: CreditCard },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function paymentStatus(status: string) {
  switch (status) {
    case "PAID":
      return {
        label: "Paid",
        className: styles.statusPaid,
      };
    case "RECONCILIATION_REQUIRED":
      return {
        label: "Needs review",
        className: styles.statusReview,
      };
    case "CREATING":
      return {
        label: "Creating",
        className: styles.statusPending,
      };
    default:
      return {
        label: "Awaiting payment",
        className: styles.statusPending,
      };
  }
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  const [error, setError] = useState("");
  const [busyProductId, setBusyProductId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialized && !user) {
      router.replace(AUTH_LINKS.login);
    }
  }, [initialized, user, router]);

  const products = useQuery({
    queryKey: ["products", user?.id],
    queryFn: () => apiRequest<Product[]>("/payments/products"),
    enabled: !!user,
  });

  const payments = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: () => apiRequest<Payment[]>("/payments"),
    enabled: !!user,
    refetchInterval: 12_000,
  });

  const paidPayments = useMemo(
    () => (payments.data ?? []).filter((payment) => payment.status === "PAID"),
    [payments.data],
  );

  useEffect(() => {
    if (!user) return;

    for (const payment of paidPayments) {
      if (payment.productId) {
        sessionStorage.removeItem(
          `payment-request:${user.id}:${payment.productId}`,
        );
      }
    }
  }, [paidPayments, user]);

  async function purchase(product: Product) {
    if (!window.Razorpay || !user) {
      setError("Payment checkout is not available. Please try again.");
      return;
    }

    setBusyProductId(product._id);
    setError("");
    setMessage("");

    try {
      const storageKey = `payment-request:${user.id}:${product._id}`;
      const requestKey =
        sessionStorage.getItem(storageKey) ?? crypto.randomUUID();

      sessionStorage.setItem(storageKey, requestKey);

      const order = await apiRequest<{
        orderId: string;
        keyId: string;
        status: string;
      }>("/payments/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
          requestKey,
        }),
      });

      if (order.status === "PAID") {
        sessionStorage.removeItem(storageKey);
        setMessage(
          "This order is already paid. Your verified access should already be available.",
        );
        await payments.refetch();
        return;
      }

      new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        name: "Future Fit",
        description: product.name,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#173B57",
        },
        modal: {
          ondismiss: () => {
            setMessage(
              "Checkout was closed. You can continue the same payment from this page.",
            );
          },
        },
        handler: () => {
          setMessage(
            "Payment submitted. We are waiting for secure backend verification before unlocking access.",
          );
          void payments.refetch();
        },
      }).open();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create payment order",
      );
    } finally {
      setBusyProductId("");
    }
  }

  if (!initialized || !user) {
    return <main>Preparing payment access…</main>;
  }

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Access & payments"
      description="Purchase assessment access securely through Razorpay and review your verified payment history."
      navItems={[...navItems]}
    >
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className={styles.pageStack}>
        {(error || products.error || payments.error) && (
          <p className={styles.error} role="alert">
            {error || products.error?.message || payments.error?.message}
          </p>
        )}

        {message ? (
          <p className={styles.success} role="status">
            {message}
          </p>
        ) : null}

        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}>
              <Sparkles size={18} />
            </span>
            <strong>{products.data?.length ?? 0}</strong>
            <span>Available access plans</span>
          </article>

          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}>
              <CheckCircle2 size={18} />
            </span>
            <strong>{paidPayments.length}</strong>
            <span>Verified purchases</span>
          </article>

          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}>
              <ReceiptText size={18} />
            </span>
            <strong>{payments.data?.length ?? 0}</strong>
            <span>Total payment records</span>
          </article>
        </section>

        <section className={styles.sectionCard}>
          <header className={styles.sectionHeader}>
            <div>
              <h2>Choose access</h2>
              <p>
                Your plan controls which paid assessments are unlocked and for
                how long.
              </p>
            </div>
            <CreditCard size={19} />
          </header>

          <div className={styles.sectionBody}>
            {products.isLoading ? (
              <p className={styles.notice}>Loading available access plans…</p>
            ) : products.data?.length === 0 ? (
              <div className={styles.empty}>
                <strong>No paid access plans are available</strong>
                <p>
                  Products must first be published by a Future Fit administrator.
                </p>
              </div>
            ) : (
              <div className={styles.productGrid}>
                {products.data?.map((product, index) => (
                  <article
                    key={product._id}
                    className={`${styles.productCard} ${
                      index === 0 ? styles.productCardFeatured : ""
                    }`}
                  >
                    <div>
                      <span className={styles.productBadge}>
                        <Sparkles size={12} />
                        {index === 0 ? "Recommended" : "Assessment access"}
                      </span>

                      <h3>{product.name}</h3>

                      <div className={styles.price}>
                        {money(product.amount, product.currency)}
                        <small>one-time</small>
                      </div>

                      <div className={styles.productMeta}>
                        <span>
                          <CalendarDays />
                          {product.durationDays} days of access
                        </span>

                        <span>
                          <ClipboardCheck />
                          {product.assessmentIds?.length ?? 0} assessment
                          {(product.assessmentIds?.length ?? 0) === 1 ? "" : "s"} included
                        </span>

                        <span>
                          <ShieldCheck />
                          Access activates after verified payment
                        </span>
                      </div>
                    </div>

                    <div className={styles.productFooter}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={Boolean(busyProductId)}
                        onClick={() => void purchase(product)}
                      >
                        <LockKeyhole size={15} />
                        {busyProductId === product._id
                          ? "Preparing checkout…"
                          : "Purchase securely"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className={styles.securityNote}>
          <ShieldCheck size={20} />
          <div>
            <strong>Payment access is verified server-side</strong>
            <p>
              Completing the Razorpay popup does not itself unlock an
              assessment. Future Fit waits for the signed Razorpay webhook, then
              marks the payment as paid and creates the assessment entitlement.
            </p>
          </div>
        </div>

        <section className={styles.sectionCard}>
          <header className={styles.sectionHeader}>
            <div>
              <h2>Payment history</h2>
              <p>
                Status refreshes automatically while payment verification is in
                progress.
              </p>
            </div>
            <ReceiptText size={19} />
          </header>

          <div className={styles.sectionBody}>
            {payments.isLoading ? (
              <p className={styles.notice}>Loading payment history…</p>
            ) : payments.data?.length === 0 ? (
              <div className={styles.empty}>
                <strong>No payment history yet</strong>
                <p>Your Future Fit purchases will appear here.</p>
              </div>
            ) : (
              <div className={styles.historyList}>
                {payments.data?.map((payment) => {
                  const status = paymentStatus(payment.status);

                  return (
                    <article className={styles.historyItem} key={payment._id}>
                      <div className={styles.historyMain}>
                        <strong>
                          Payment {payment._id.slice(-8).toUpperCase()}
                        </strong>
                        <span>
                          {payment.paidAt
                            ? `Paid ${new Date(payment.paidAt).toLocaleString()}`
                            : payment.createdAt
                              ? `Created ${new Date(
                                  payment.createdAt,
                                ).toLocaleString()}`
                              : `${payment.durationDays ?? "—"} days access`}
                        </span>
                      </div>

                      <div className={styles.historyAmount}>
                        {money(payment.amount, payment.currency)}
                      </div>

                      <span
                        className={`${styles.statusBadge} ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
