import Mailjet from "node-mailjet";
import { APP_CONFIG } from "@/lib/constants";

const mailjet =
  process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY
    ? Mailjet.apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY)
    : null;

export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: string; contentType: string }>;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!mailjet) {
    console.warn("Mailjet not configured. Email skipped:", payload.subject);
    return false;
  }

  try {
    const fromEmail = process.env.MAILJET_FROM_EMAIL || APP_CONFIG.email;
    const fromName = process.env.MAILJET_FROM_NAME || APP_CONFIG.name;

    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: payload.to, Name: payload.toName || payload.to }],
          Subject: payload.subject,
          HTMLPart: payload.html,
          TextPart: payload.text,
          Attachments: payload.attachments?.map((a) => ({
            ContentType: a.contentType,
            Filename: a.filename,
            Base64Content: a.content,
          })),
        },
      ],
    });
    return true;
  } catch (err) {
    console.error("Mailjet error:", err);
    return false;
  }
}

function baseTemplate(content: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f3f4f6;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);">
        <tr><td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);padding:32px;text-align:center;color:#fff;">
          <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-.02em;">${APP_CONFIG.name}</h1>
          <p style="margin:4px 0 0;opacity:.85;font-size:13px;">Wholesale Spare Parts</p>
        </td></tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">
          <p style="margin:0 0 4px;">© ${new Date().getFullYear()} ${APP_CONFIG.name}. All rights reserved.</p>
          <p style="margin:0;">${APP_CONFIG.email} · ${APP_CONFIG.phone}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const emailTemplates = {
  welcome: (name: string, email?: string, password?: string) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">Welcome, ${name}!</h2>
      <p>Your account at ${APP_CONFIG.name} has been created. You can sign in below to start using the dashboard.</p>
      ${email ? `<p style="margin:8px 0;"><strong>Email:</strong> ${email}</p>` : ""}
      ${password ? `<p style="margin:0;"><strong>Temporary password:</strong> ${password}</p>` : ""}
      <a href="${APP_CONFIG.url}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Sign in</a>
    `,
      "Welcome"
    ),

  selfSignup: (name: string) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">Welcome, ${name}!</h2>
      <p>Thanks for creating an account at ${APP_CONFIG.name}. Your request has been received and is ready to use.</p>
      <a href="${APP_CONFIG.url}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Sign in to dashboard</a>
    `,
      "Welcome"
    ),

  pendingApproval: (name: string) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">Thanks for signing up, ${name}!</h2>
      <p>Your account at <strong>${APP_CONFIG.name}</strong> has been created and is waiting for an administrator to review and activate it.</p>
      <p>You will receive another email as soon as your account is approved. If you have any questions in the meantime, contact the team at <a href="mailto:${APP_CONFIG.email}">${APP_CONFIG.email}</a>.</p>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 16px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;"><strong>What's next?</strong> An admin will assign your role (Staff or Admin) and you'll be able to sign in.</p>
      </div>
    `,
      "Your account is pending approval"
    ),

  accountApproved: (name: string) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">You're approved, ${name}!</h2>
      <p>Your account at <strong>${APP_CONFIG.name}</strong> has been approved. You can now sign in and start using the dashboard.</p>
      <a href="${APP_CONFIG.url}/login" style="display:inline-block;background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Sign in to dashboard</a>
    `,
      "Your account is approved"
    ),

  passwordReset: (name: string, resetUrl: string) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">Password reset request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Reset password</a>
      <p style="font-size:13px;color:#6b7280;">If you didn't request this, please ignore this email.</p>
    `,
      "Reset your password"
    ),

  receipt: (data: { saleNumber: string; total: number; date: string; url: string }) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">Thank you for your purchase!</h2>
      <p>Here is your receipt from ${APP_CONFIG.name}.</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 6px;"><strong>Receipt #:</strong> ${data.saleNumber}</p>
        <p style="margin:0 0 6px;"><strong>Date:</strong> ${data.date}</p>
        <p style="margin:0;"><strong>Total:</strong> ${APP_CONFIG.currencySymbol}${data.total.toFixed(2)}</p>
      </div>
      <a href="${data.url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">View Receipt</a>
    `,
      "Your Receipt"
    ),

  lowStockAlert: (items: Array<{ name: string; quantity: number; reorderLevel: number }>) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">Low stock alert</h2>
      <p>The following items are running low and may need restocking:</p>
      <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <thead><tr style="background:#f3f4f6;text-align:left;">
          <th style="border:1px solid #e5e7eb;">Product</th>
          <th style="border:1px solid #e5e7eb;">Quantity</th>
          <th style="border:1px solid #e5e7eb;">Reorder Level</th>
        </tr></thead>
        <tbody>
        ${items
          .map(
            (i) => `<tr>
          <td style="border:1px solid #e5e7eb;">${i.name}</td>
          <td style="border:1px solid #e5e7eb;color:#dc2626;font-weight:600;">${i.quantity}</td>
          <td style="border:1px solid #e5e7eb;">${i.reorderLevel}</td>
        </tr>`
          )
          .join("")}
        </tbody>
      </table>
    `,
      "Low Stock Alert"
    ),

  dailyReport: (data: { date: string; totalSales: number; transactions: number; topProduct: string }) =>
    baseTemplate(
      `
      <h2 style="margin:0 0 16px;font-size:20px;">Daily report — ${data.date}</h2>
      <div style="display:grid;gap:12px;">
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Total Sales</p>
          <p style="margin:0;font-size:22px;font-weight:700;">${APP_CONFIG.currencySymbol}${data.totalSales.toFixed(2)}</p>
        </div>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Transactions</p>
          <p style="margin:0;font-size:22px;font-weight:700;">${data.transactions}</p>
        </div>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Top Selling Product</p>
          <p style="margin:0;font-size:18px;font-weight:600;">${data.topProduct}</p>
        </div>
      </div>
    `,
      "Daily Report"
    ),
};
