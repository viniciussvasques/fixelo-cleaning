/**
 * Twilio Test API
 * Tests Twilio connection by sending a test SMS
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import twilio from 'twilio';

export async function POST(req: Request) {
    try {
        // Check admin auth
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get test phone number from request or use admin's phone
        const body = await req.json().catch(() => ({}));
        const testPhone = body.phone;

        // Get Twilio config from database
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number'] }
            }
        });

        const configMap = new Map(configs.map(c => [c.key, c.value]));
        const accountSid = configMap.get('twilio_account_sid');
        const authToken = configMap.get('twilio_auth_token');
        const fromNumber = configMap.get('twilio_phone_number');

        if (!accountSid || !authToken || !fromNumber) {
            return NextResponse.json({
                success: false,
                message: 'Twilio not configured. Missing: ' +
                    [!accountSid && 'Account SID', !authToken && 'Auth Token', !fromNumber && 'Phone Number']
                        .filter(Boolean).join(', ')
            }, { status: 400 });
        }

        // Create Twilio client
        const client = twilio(accountSid, authToken);

        // Verify account (doesn't send SMS, just checks credentials)
        const account = await client.api.accounts(accountSid).fetch();

        const result: {
            success: boolean;
            message: string;
            details: {
                accountStatus: string;
                accountName: string;
                fromNumber: string;
                testSmsSent?: boolean;
                testSmsTo?: string;
            };
        } = {
            success: true,
            message: 'Twilio connection successful',
            details: {
                accountStatus: account.status,
                accountName: account.friendlyName,
                fromNumber: fromNumber
            }
        };

        // If test phone provided, send a test SMS
        if (testPhone) {
            try {
                await client.messages.create({
                    body: '✅ Fixelo Test SMS - Your Twilio integration is working!',
                    from: fromNumber,
                    to: testPhone
                });
                result.details.testSmsSent = true;
                result.details.testSmsTo = testPhone;
                result.message = `Twilio connected! Test SMS sent to ${testPhone}`;
            } catch (smsError) {
                result.message = 'Twilio connected but failed to send test SMS: ' +
                    (smsError instanceof Error ? smsError.message : 'Unknown error');
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Twilio Test] Error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to connect to Twilio',
            error: error instanceof Error ? error.name : 'UnknownError'
        }, { status: 500 });
    }
}
