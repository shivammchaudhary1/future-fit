"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fbfc",
          color: "#173b57",
        }}
      >
        <main
          style={{
            width: "min(520px, 100%)",
            padding: "32px",
            border: "1px solid #dce8ec",
            borderRadius: "20px",
            background: "#fff",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Future Fit needs to reload.</h1>
          <p style={{ color: "#708593", lineHeight: 1.6 }}>
            An unexpected application error occurred. Reload the application and
            try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "44px",
              padding: "0 18px",
              border: 0,
              borderRadius: "11px",
              color: "#fff",
              background: "#173b57",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
