import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth'; // Ensure this path is correct
import { prisma } from '@fixelo/database'; // Ensure this path is correct

export async function POST(_req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get Cleaner Profile
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            include: { user: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        let accountId = cleaner.stripeAccountId;

        // 2. If no account exists, create one
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: session.user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual',
                metadata: {
                    cleanerId: cleaner.id,
                }
            });

            accountId = account.id;

            // Save to DB
            await prisma.cleanerProfile.update({
                where: { id: cleaner.id },
                data: { stripeAccountId: accountId }
            });
        }

        // 3. Create Account Link
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/cleaner/banking`, // If they back out/refresh
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/cleaner/banking?success=true`, // Completion
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });

    } catch (error: unknown) {
        console.error('Stripe Connect error:', error);

        // Get detailed error message
        let errorMessage = 'Failed to create account link';
        if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = (error as { message: string }).message;
            console.error('Stripe error message:', errorMessage);
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
