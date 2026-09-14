"use client";
import { useState } from "react";
import Script from "next/script";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
interface Product {
  _id: string;
  name: string;
  amount: number;
  currency: string;
  durationDays: number;
}
interface Payment {
  _id: string;
  status: string;
  amount: number;
  currency: string;
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
      handler: () => void;
    }) => Checkout;
  }
}
export default function PaymentsPage() {
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
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
  async function purchase(product: Product) {
    if (!window.Razorpay || !user) {
      setError("Payment checkout is not available. Please try again.");
      return;
    }
    setBusy(true);
    setError("");
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
        body: JSON.stringify({ productId: product._id, requestKey }),
      });
      if (order.status === "PAID") {
        setMessage("This order is already paid.");
        return;
      }
      new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        name: "Future Fit",
        handler: () => {
          setMessage(
            "Checkout completed. Access unlocks after backend payment verification.",
          );
          void payments.refetch();
        },
      }).open();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to create payment order",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="student-dashboard">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <h1>Assessment access</h1>
      {(error || products.error || payments.error) && (
        <p role="alert">
          {error || products.error?.message || payments.error?.message}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {products.data?.map((product) => (
        <section key={product._id}>
          <h2>{product.name}</h2>
          <p>
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: product.currency,
            }).format(product.amount / 100)}{" "}
            · {product.durationDays} days
          </p>
          <button disabled={busy} onClick={() => void purchase(product)}>
            Purchase
          </button>
        </section>
      ))}
      <h2>Payment history</h2>
      {payments.data?.map((payment) => (
        <p key={payment._id}>
          {payment._id}: {payment.status}
        </p>
      ))}
    </main>
  );
}
