export function AuthMessage({
  kind = "error",
  children,
}: {
  kind?: "error" | "success";
  children?: string;
}) {
  return children ? (
    <p className={`auth-message ${kind}`} role="status">
      {children}
    </p>
  ) : null;
}
