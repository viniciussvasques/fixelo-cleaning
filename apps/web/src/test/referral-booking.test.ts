import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as createPaymentIntent } from '@/app/api/create-payment-intent/route';
import { prisma } from '@fixelo/database';
import { getStripeClient } from '@/lib/stripe';
import type { ServiceType, User } from '@prisma/client';
import type Stripe from 'stripe';

// Mock stripe instance
const mockStripeInstance = {
    paymentIntents: {
        create: vi.fn(),
    },
};

// Mock dependencies
vi.mock('@fixelo/database', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            count: vi.fn(),
        },
        serviceType: {
            findUnique: vi.fn(),
        },
        booking: {
            count: vi.fn(),
        },
        addOn: {
            findMany: vi.fn(),
        },
    }
}));

vi.mock('@/lib/stripe', () => ({
    getStripeClient: vi.fn(() => Promise.resolve(mockStripeInstance)),
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve({ user: { id: 'user-1' } })),
}));

describe('Referral System Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should apply $20 discount for a valid referral code on first booking', async () => {
        // Mock service data
        vi.mocked(prisma.serviceType.findUnique).mockResolvedValue({ id: 's1', basePrice: 100, baseTime: 120 } as unknown as ServiceType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'referrer-1', referralCode: 'REF123' } as unknown as User);
        vi.mocked(prisma.booking.count).mockResolvedValue(0);

        mockStripeInstance.paymentIntents.create.mockResolvedValue({ client_secret: 'pi_test_secret_test' } as unknown as Stripe.Response<Stripe.PaymentIntent>);

        const req = new Request('http://localhost/api/create-payment-intent', {
            method: 'POST',
            body: JSON.stringify({
                serviceId: 's1',
                homeDetails: { bedrooms: 1, bathrooms: 1, hasPets: false },
                referralCode: 'REF123'
            })
        });

        const response = await createPaymentIntent(req);
        const data = await response.json() as { amount: number };
        console.log('DEBUG DATA:', data);

        expect(data.amount).toBe(80); // 100 - 20 referral discount
        expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: 8000, // 80 USD in cents
            metadata: expect.objectContaining({
                referralCode: 'REF123',
                discountAmount: '20'
            })
        }));
    });

    it('should not apply referral discount for existing users', async () => {
        vi.mocked(prisma.serviceType.findUnique).mockResolvedValue({ id: 's1', basePrice: 100, baseTime: 120 } as unknown as ServiceType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'referrer-1', referralCode: 'REF123' } as unknown as User);
        vi.mocked(prisma.booking.count).mockResolvedValue(1); // Not first booking

        mockStripeInstance.paymentIntents.create.mockResolvedValue({ client_secret: 'pi_test_secret_test' } as unknown as Stripe.Response<Stripe.PaymentIntent>);

        const req = new Request('http://localhost/api/create-payment-intent', {
            method: 'POST',
            body: JSON.stringify({
                serviceId: 's1',
                homeDetails: { bedrooms: 1, bathrooms: 1, hasPets: false },
                referralCode: 'REF123'
            })
        });

        const response = await createPaymentIntent(req);
        const data = await response.json();

        expect(data.amount).toBe(100); // No discount
    });
});
