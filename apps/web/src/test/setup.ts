import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    redirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}))

// Mock Server Actions
vi.mock('next/server', () => ({
    NextResponse: {
        json: (body: unknown, init?: ResponseInit) => ({
            body,
            init,
            ...init,
            json: async () => body
        }),
        redirect: (url: string) => ({ url }),
        next: () => ({}),
    }
}))
