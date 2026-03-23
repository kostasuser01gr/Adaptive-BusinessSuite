import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  get isConfigured(): boolean {
    return !!(
      env.SMTP_HOST &&
      env.SMTP_PORT &&
      env.SMTP_USER &&
      env.SMTP_PASSWORD
    );
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      if (!this.isConfigured) {
        throw new Error("Email service not configured. Set SMTP_* env vars.");
      }
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST!,
        port: parseInt(env.SMTP_PORT!, 10),
        secure: parseInt(env.SMTP_PORT!, 10) === 465,
        auth: {
          user: env.SMTP_USER!,
          pass: env.SMTP_PASSWORD!,
        },
      });
    }
    return this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(
        `[email-service] Would send email to ${options.to}: ${options.subject}`,
      );
      return false;
    }

    try {
      const transport = this.getTransporter();
      await transport.sendMail({
        from: env.EMAIL_FROM || `"Nexus Suite" <noreply@nexus.app>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (error) {
      console.error("[email-service] Failed to send email:", error);
      return false;
    }
  }

  /**
   * Simple template rendering with {{variable}} interpolation.
   */
  renderTemplate(template: string, data: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
  }
}

export const emailService = new EmailService();
