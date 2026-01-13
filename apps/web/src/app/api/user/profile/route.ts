import { prisma } from '@fixelo/database';
import { z } from 'zod';
import { withAuth, handleError, successResponse } from '@/lib/api-utils';

const updateProfileSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
});

// GET - Fetch user profile
export async function GET() {
    return withAuth(async (userId) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                }
            });

            if (!user) {
                return handleError({ message: 'User not found', status: 404 });
            }

            return successResponse(user);
        } catch (error) {
            return handleError(error);
        }
    });
}

export async function PATCH(request: Request) {
    return withAuth(async (userId) => {
        try {
            const body = await request.json();
            const validatedData = updateProfileSchema.parse(body);

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    phone: validatedData.phone,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                }
            });

            return successResponse(updatedUser);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return handleError({ message: 'Validation failed', status: 400 });
            }
            return handleError(error);
        }
    });
}
