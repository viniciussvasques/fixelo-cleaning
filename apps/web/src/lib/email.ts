import nodemailer from 'nodemailer';
import { prisma, Prisma } from '@fixelo/database';

// Configuração do transporter SMTP Mailbux
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'my.mailbux.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER || 'no-reply@fixelo.app',
      pass: process.env.SMTP_PASSWORD || '',
    },
    tls: {
      // Não rejeitar certificados não autorizados
      rejectUnauthorized: false,
    },
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

/**
 * Envia um email via SMTP Mailbux
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();
  const fromEmail = options.from || process.env.SMTP_FROM || 'no-reply@fixelo.app';

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });

    console.log('✅ Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
}

/**
 * Envia email e salva notificação no banco de dados
 */
export async function sendEmailNotification(
  userId: string,
  options: EmailOptions,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Enviar email
    await sendEmail(options);

    // Salvar notificação no banco
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
    console.error('❌ Erro ao enviar notificação por email:', error);

    // Salvar notificação como falha (silenciosamente, não relançar erro)
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
      console.error('❌ Erro ao salvar notificação falha no banco:', dbError);
    }

    // Não relançar o erro para não interromper o fluxo
  }
}

/**
 * Processa notificações pendentes do banco e envia emails
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
    take: 50, // Processar em lotes de 50
  });

  for (const notification of pendingNotifications) {
    try {
      await sendEmail({
        to: notification.user.email,
        subject: notification.subject || 'Notificação Fixelo',
        html: notification.body,
        text: notification.body,
      });

      // Atualizar notificação como enviada
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`❌ Erro ao processar notificação ${notification.id}:`, error);

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

