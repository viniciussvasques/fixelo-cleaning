# Fixelo Technical Documentation

## 1. Project Overview
Fixelo is an on-demand cleaning service marketplace. It connects **Customers** needing cleaning services with **Cleaners** (Providers). The system manages the entire lifecycle from booking and matching to payment and payouts.

## 2. Technical Stack
- **Frontend**: Next.js 14 (App Router, Server Components)
- **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons
- **State Management**: Zustand (Client-side), React Query (Server-side/API)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (v5 Beta)
- **Payments**: Stripe (Payment Intents for Customers, Connect for Providers)
- **Testing**: Vitest, JSDOM

## 3. Architecture
The project is a Monorepo powered by Turborepo:
- `apps/web`: The Next.js 14 application.
- `packages/database`: Prisma schema and database client.

### Key Directories (`apps/web/src`)
- `app/api/**`: RESTful API routes.
- `app/book/**`: Multi-step booking funnel.
- `app/dashboard/**`: Customer dashboard.
- `app/cleaner/**`: Provider dashboard and onboarding.
- `app/admin/**`: Back-office management.
- `lib/**`: Shared utilities (Stripe, Matching algorithm, Auth config).
- `store/**`: Global client state (Booking store).

## 4. User Flows

### A. Customer Booking Flow
1. **Service Selection**: Choose Standard, Deep, or Airbnb cleaning.
2. **Details**: Specify bedrooms, bathrooms, and instructions.
3. **Schedule**: Select date and time window.
4. **Auth**: Guest checkout or login (integrated `check-email` flow).
5. **Address**: Select or add a service address.
6. **Add-ons**: Select optional extras (Oven, Fridge, etc.).
7. **Payment**: Secure Stripe checkout.

### B. Provider Journey
1. **Onboarding**: Multi-step registration (Business info, docs, experience).
2. **Stripe Connect**: Onboard to Stripe for automatic payouts.
3. **Job Management**: Receive offers, Accept/Decline, track performance metrics.
4. **Schedule**: Manage daily/weekly availability.

### C. Matching Algorithm (`lib/matching.ts`)
The system uses an Uber-like weighted scoring algorithm:
- **Distance (20%)**: Proximity to the service address.
- **Rating (40%)**: Cumulative customer feedback.
- **Metrics (40%)**: Acceptance rate, punctuality, and cancellation history.

## 5. Financial Flow
- **Booking**: Customer is charged via Payment Intent.
- **Platform Fee**: Platform takes a commission (configured in `/admin/settings/financial`).
- **Transfer**: After job completion, funds are transferred to the cleaner's Stripe Connect account.
- **Weekly Payouts**: Automated worker script `src/workers/payout.ts` handles weekly settlements.

## 6. Testing Strategy
- **Unit Tests**: `npm run test` (Vitest).
- **Coverage**: `npm run test:coverage` (v8 provider).
- **Core Logic**: High coverage is maintained for matching and metrics logic.

## 7. Deployment
- **Frontend**: Vercel (recommended).
- **Database**: Supabase or RDS.
- **Worker**: Can be run as a cron job or a persistent process on a VPS.

## 8. Development Setup
1. `npm install`
2. `npx prisma generate`
3. Setup `.env` (DATABASE_URL, NEXTAUTH_SECRET, STRIPE_SECRET_KEY)
4. `npm run dev`
