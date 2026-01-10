/**
 * Email Service with Dynamic Configuration
 * 
 * Loads SMTP configuration from database at runtime.
 * Falls back to environment variables if database is unavailable.
 */

import nodemailer from 'nodemailer';
import { prisma, Prisma } from '@fixelo/database';

// Cache for email config
interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

let cachedEmailConfig: EmailConfig | null = null;
let emailConfigCacheTimestamp = 0;
const EMAIL_CONFIG_CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Gets email configuration from database or env fallback
 */
async function getEmailConfig(): Promise<EmailConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedEmailConfig && (now - emailConfigCacheTimestamp) < EMAIL_CONFIG_CACHE_TTL) {
    return cachedEmailConfig;
  }

  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from']
        }
      },
      select: { key: true, value: true }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));

    // Build config from database or fallback to env
    const config: EmailConfig = {
      host: configMap.get('smtp_host') || process.env.SMTP_HOST || 'my.mailbux.com',
      port: parseInt(configMap.get('smtp_port') || process.env.SMTP_PORT || '587'),
      user: configMap.get('smtp_user') || process.env.SMTP_USER || 'no-reply@fixelo.app',
      password: configMap.get('smtp_password') || process.env.SMTP_PASSWORD || '',
      from: configMap.get('smtp_from') || process.env.SMTP_FROM || 'no-reply@fixelo.app',
    };

    cachedEmailConfig = config;
    emailConfigCacheTimestamp = now;
    return config;
  } catch (error) {
    console.error('[Email] Error fetching config from DB:', error);

    // Fallback to environment variables
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'my.mailbux.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || 'no-reply@fixelo.app',
      password: process.env.SMTP_PASSWORD || '',
      from: process.env.SMTP_FROM || 'no-reply@fixelo.app',
    };

    cachedEmailConfig = config;
    emailConfigCacheTimestamp = now;
    return config;
  }
}

/**
 * Creates a nodemailer transporter with current config
 */
async function createTransporter() {
  const config = await getEmailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Clears the cached email config (call after updating in admin panel)
 */
export function clearEmailConfigCache(): void {
  cachedEmailConfig = null;
  emailConfigCacheTimestamp = 0;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

/**
 * Sends an email via SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = await createTransporter();
  const config = await getEmailConfig();
  const fromEmail = options.from || config.from;

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });

    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

/**
 * Sends email and saves notification to database
 */
export async function sendEmailNotification(
  userId: string,
  options: EmailOptions,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await sendEmail(options);

    await prisma.notification.create({
      data: {
        userId,
        type: 'EMAIL',
        subject: options.subject,
        body: options.html || options.text || '',
        status: 'SENT',
        sentAt: new Date(),
        metadata: (metadata || {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error('❌ Error sending email notification:', error);

    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'EMAIL',
          subject: options.subject,
          body: options.html || options.text || '',
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          metadata: (metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (dbError) {
      console.error('❌ Error saving failed notification:', dbError);
    }
  }
}

/**
 * Processes pending email notifications from database
 */
export async function processPendingEmailNotifications(): Promise<void> {
  const pendingNotifications = await prisma.notification.findMany({
    where: {
      type: 'EMAIL',
      status: 'PENDING',
    },
    include: {
      user: true,
    },
    take: 50,
  });

  for (const notification of pendingNotifications) {
    try {
      await sendEmail({
        to: notification.user.email,
        subject: notification.subject || 'Fixelo Notification',
        html: notification.body,
        text: notification.body,
      });

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`❌ Error processing notification ${notification.id}:`, error);

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
