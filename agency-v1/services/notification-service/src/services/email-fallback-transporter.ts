/**
 * Email Multi-Transporter Fallback Manager
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-tier email dispatcher supporting Resend API, Nodemailer SMTP,
 * and persistent Outbox Event database backup.
 */

import { prisma } from "@agency/database";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  companyId?: string;
  metadata?: Record<string, any>;
}

export interface EmailDispatchResult {
  success: boolean;
  provider: string;
  messageId?: string;
  attempts: number;
  fallbackTriggered: boolean;
  error?: string;
}

export async function sendResilientEmail(payload: SendEmailPayload): Promise<EmailDispatchResult> {
  let attempts = 0;

  // ── Tier 1: Primary API (Resend) ──────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    attempts++;
    try {
      console.log(`[Email-Fallback] Tier 1: Sending email via Resend to ${payload.to}...`);
      const { Resend } = require("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const res = await resend.emails.send({
        from: process.env.EMAIL_FROM || "LegacyMark <noreply@legacymarksas.com>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (res && (res.id || res.data?.id)) {
        return {
          success: true,
          provider: "resend",
          messageId: res.id || res.data?.id,
          attempts,
          fallbackTriggered: false,
        };
      }
    } catch (err: any) {
      console.warn(`[Email-Fallback] Tier 1 (Resend) failed:`, err?.message || err);
    }
  }

  // ── Tier 2: Secondary SMTP Transporter (Nodemailer / SES) ─────────────────
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    attempts++;
    try {
      console.log(`[Email-Fallback] Tier 2: Attempting SMTP fallback for ${payload.to}...`);
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        timeout: 5000,
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || "LegacyMark <noreply@legacymarksas.com>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId,
        attempts,
        fallbackTriggered: true,
      };
    } catch (err: any) {
      console.warn(`[Email-Fallback] Tier 2 (SMTP) failed:`, err?.message || err);
    }
  }

  // ── Tier 3: Persistent Outbox Event Queue Backup ──────────────────────────
  attempts++;
  console.error(`[Email-Fallback] All live email channels failed. Saving to Outbox DLQ queue for automatic retry.`);
  try {
    const outboxEvent = await prisma.outboxEvent.create({
      data: {
        correlationId: `email_retry_${Date.now()}`,
        eventName: "notification.email_retry",
        payload: {
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          companyId: payload.companyId,
          queuedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      provider: "outbox-dlq",
      messageId: outboxEvent.id,
      attempts,
      fallbackTriggered: true,
    };
  } catch (err: any) {
    console.error(`[Email-Fallback] Fatal: Failed to persist outbox event:`, err);
    return {
      success: false,
      provider: "none",
      attempts,
      fallbackTriggered: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
