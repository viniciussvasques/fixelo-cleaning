import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/create-payment-intent/route';
import { prisma } from '@fixelo/database';
import { stripe } from '@/lib/stripe';
import type { ServiceType, AddOn } from '@prisma/client';
import type Stripe from 'stripe';

// Mocks
vi.mock('@fixelo/database', () => ({
    prisma: {
        serviceType: {
            findUnique: vi.fn()
        },
        addOn: {
            findMany: vi.fn()
        }
    }
}));

vi.mock('@/lib/stripe', () => ({
    stripe: {
        paymentIntents: {
            create: vi.fn()
        }
    }
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({ user: { id: 'user1' } })
}));

describe('Create Payment Intent API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should correctly sum service price + add-ons', async () => {
        // Setup
        vi.mocked(prisma.serviceType.findUnique).mockResolvedValue({
            id: 'service1',
            basePrice: 100 // $100
        } as ServiceType);

        vi.mocked(prisma.addOn.findMany).mockResolvedValue([
            { id: 'addon1', price: 20 }, // $20
            { id: 'addon2', price: 30 }  // $30
        ] as AddOn[]);

        vi.mocked(stripe.paymentIntents.create).mockResolvedValue({
            client_secret: 'secret_123'
        } as unknown as Stripe.Response<Stripe.PaymentIntent>);

        const req = {
            json: async () => ({
                serviceId: 'service1',
                homeDetails: { bedrooms: 1, bathrooms: 1, hasPets: false },
                addOns: ['addon1', 'addon2']
            })
        } as unknown as Request;

        const res = await POST(req);
        const _data = res.body; // Mocked NextResponse returns body

        // Assertions
        // Total should be 100 + 20 + 30 = 150
        // Stripe expects cents: 15000

        expect(prisma.addOn.findMany).toHaveBeenCalledWith({
            where: { id: { in: ['addon1', 'addon2'] } }
        });

        expect(stripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: 15000
        }));
    });
});
