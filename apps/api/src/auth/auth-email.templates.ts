const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function verificationEmail(url: string) {
  return `<h1>Welcome to Future Fit</h1><p>Verify your email to start your career guidance journey.</p><p><a href="${escape(url)}">Verify my email</a></p><p>This link expires in 30 minutes.</p>`;
}
export function passwordResetEmail(url: string) {
  return `<h1>Reset your password</h1><p>Use the secure link below to choose a new password.</p><p><a href="${escape(url)}">Reset my password</a></p><p>This link expires in 15 minutes. Ignore this message if you did not request it.</p>`;
}
