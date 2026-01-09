import { stripe } from '@/lib/stripe';
import { prisma } from '@fixelo/database';
import { withAuth, handleError, successResponse, ApiError } from '@/lib/api-utils';

const db = prisma as unknown as {
    user: {
        findUnique: (args: {
            where: { email: string };
            select?: { id?: boolean; stripeCustomerId?: boolean };
        }) => Promise<{ id: string; stripeCustomerId: string | null } | null>;
        update: (args: {
            where: { id: string };
            data: { stripeCustomerId: string };
        }) => Promise<unknown>;
    };
};

export async function GET() {
    return withAuth(async (_userId, email) => {
        try {
            const user = await db.user.findUnique({
                where: { email },
                select: { stripeCustomerId: true }
            });

            if (!user?.stripeCustomerId) {
                return successResponse([]);
            }

            const paymentMethods = await stripe.paymentMethods.list({
                customer: user.stripeCustomerId,
                type: 'card',
            });

            return successResponse(paymentMethods.data.map(pm => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year,
            })));
        } catch (error) {
            return handleError(error);
        }
    });
}

export async function POST(_req: Request) {
    return withAuth(async (userId, email) => {
        try {
            const user = await db.user.findUnique({
                where: { email },
                select: { id: true, stripeCustomerId: true }
            });

            if (!user) {
                throw new ApiError('User not found', 404);
            }

            let customerId = user.stripeCustomerId;

            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: email,
                    name: `User ${userId}`,
                    metadata: { userId }
                });
                customerId = customer.id;
                await db.user.update({
                    where: { id: userId },
                    data: { stripeCustomerId: customerId }
                });
            }

            const setupIntent = await stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
            });

            return successResponse({ clientSecret: setupIntent.client_secret });
        } catch (error) {
            return handleError(error);
        }
    });
}

export async function DELETE(req: Request) {
    return withAuth(async () => {
        try {
            const { searchParams } = new URL(req.url);
            const paymentMethodId = searchParams.get('id');

            if (!paymentMethodId) {
                throw new ApiError('Payment method ID required', 400);
            }

            await stripe.paymentMethods.detach(paymentMethodId);

            return successResponse({ success: true });
        } catch (error) {
            return handleError(error);
        }
    });
}
