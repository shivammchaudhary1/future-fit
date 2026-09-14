import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { AUTH_EMAIL_SUBJECTS } from "./auth.constants.js";
import {
  passwordResetEmail,
  verificationEmail,
} from "./auth-email.templates.js";

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private readonly resend: Resend | null;
  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
  }
  async sendVerification(email: string, token: string): Promise<void> {
    const url = `${this.config.get("WEB_ORIGIN", "http://localhost:3000")}/verify-email?token=${token}`;
    await this.send(
      email,
      AUTH_EMAIL_SUBJECTS.verification,
      verificationEmail(url),
      url,
    );
  }
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const url = `${this.config.get("WEB_ORIGIN", "http://localhost:3000")}/reset-password?token=${token}`;
    await this.send(
      email,
      AUTH_EMAIL_SUBJECTS.passwordReset,
      passwordResetEmail(url),
      url,
    );
  }
  private async send(
    to: string,
    subject: string,
    html: string,
    developmentUrl: string,
  ) {
    if (!this.resend) {
      if (this.config.get("NODE_ENV") === "production")
        throw new Error("Authentication email delivery is not configured.");
      this.logger.warn(
        `RESEND_API_KEY is not configured. Development auth URL: ${developmentUrl}`,
      );
      return;
    }
    const from = this.config.getOrThrow<string>("AUTH_EMAIL_FROM");
    const { error } = await this.resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    if (error) throw new Error(`Authentication email failed: ${error.message}`);
  }
}
