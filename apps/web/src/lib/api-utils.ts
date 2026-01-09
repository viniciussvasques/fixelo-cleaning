import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export class ApiError extends Error {
    constructor(public message: string, public status: number = 400) {
        super(message);
    }
}

export async function withAuth(handler: (userId: string, email: string) => Promise<Response>) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return await handler(session.user.id, session.user.email);
    } catch (error) {
        return handleError(error);
    }
}

export function handleError(error: unknown) {
    console.error('API Error:', error);
    if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

export function successResponse(data: unknown, status: number = 200) {
    return NextResponse.json(data, { status });
}
