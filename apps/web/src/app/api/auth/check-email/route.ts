import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { z } from 'zod';

const checkEmailSchema = z.object({
    email: z.string().email(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = checkEmailSchema.parse(body);

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        return NextResponse.json({ exists: !!user });
    } catch (_error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
