# 🧹 Fixelo - Professional Home Cleaning Marketplace

> **The Uber of Home Cleaning** - A two-sided marketplace connecting verified cleaning professionals with homeowners.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)
![Stripe](https://img.shields.io/badge/Stripe-Connect-635BFF)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [User Flows](#user-flows)
- [Admin Panel](#admin-panel)
- [Payment System](#payment-system)
- [Notifications](#notifications)
- [Deployment](#deployment)

---

## 🎯 Overview

Fixelo is a complete cleaning services marketplace platform that connects:

- **Customers** who need home cleaning services
- **Cleaners** who provide professional cleaning services
- **Administrators** who manage the platform

### Business Model
- **Platform Fee**: 30% commission per booking
- **Stripe Connect**: Split payments between platform and cleaners
- **Add-ons**: Additional services (oven cleaning, window cleaning, etc.)

---

## ✨ Features

### For Customers
- ✅ Easy booking flow (5 steps)
- ✅ Service selection (Standard, Deep, Airbnb cleaning)
- ✅ Add-ons selection
- ✅ Date & time scheduling
- ✅ Address management
- ✅ Secure Stripe payments
- ✅ Booking history dashboard
- ✅ Real-time notifications

### For Cleaners
- ✅ Complete onboarding flow
- ✅ Identity verification
- ✅ Document upload (ID, Insurance)
- ✅ Reference verification
- ✅ Stripe Connect for payments
- ✅ Job management dashboard
- ✅ Accept/Reject jobs
- ✅ Earnings tracking
- ✅ Schedule management

### For Admins
- ✅ User management
- ✅ Cleaner verification/approval
- ✅ Booking management
- ✅ Service configuration
- ✅ Add-ons management
- ✅ Financial settings
- ✅ Email template management
- ✅ Platform configuration
- ✅ Integrations dashboard

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js v5 |
| **Payments** | Stripe Connect |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **State Management** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Email** | Resend (Nodemailer compatible) |
| **SMS** | Twilio |
| **Notifications** | Server-Sent Events (SSE) |
| **Push** | Web Push API |

---

## 📁 Project Structure

```
fixelo/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── admin/      # Admin panel
│       │   │   ├── auth/       # Authentication
│       │   │   ├── book/       # Booking flow
│       │   │   ├── cleaner/    # Cleaner dashboard
│       │   │   ├── dashboard/  # Customer dashboard
│       │   │   └── api/        # API routes
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom hooks
│       │   ├── lib/            # Utilities
│       │   └── store/          # Zustand stores
│       └── public/             # Static assets
│
├── packages/
│   └── database/               # Prisma schema & client
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   └── seed.ts         # Seed data
│       └── src/
│           └── client.ts       # Prisma client export
│
└── package.json                # Root package.json (workspaces)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Stripe account
- (Optional) Twilio account for SMS
- (Optional) Resend account for emails

### Installation

```bash
# Clone the repository
git clone https://github.com/viniciussvasques/fixelo2.0.git
cd fixelo2.0

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
cp packages/database/.env.example packages/database/.env

# Generate Prisma client
npm run db:generate -w @fixelo/database

# Run database migrations
npm run db:migrate -w @fixelo/database

# Seed the database
npm run db:seed -w @fixelo/database

# Start development server
npm run dev
```

### Default Users (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fixelo.app | password123 |
| Cleaner | cleaner@fixelo.app | password123 |

---

## 🔐 Environment Variables

### apps/web/.env.local

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/fixelo"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Resend/SMTP)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@fixelo.app"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
```

---

## 🗄 Database Schema

### Main Models

| Model | Description |
|-------|-------------|
| `User` | All users (customers, cleaners, admins) |
| `CleanerProfile` | Cleaner-specific data |
| `Booking` | Service bookings |
| `ServiceType` | Cleaning service types |
| `AddOn` | Additional services |
| `Assignment` | Cleaner-booking assignments |
| `Payment` | Payment records |
| `Notification` | User notifications |
| `Message` | Chat messages |
| `Review` | Customer reviews |

### Key Relationships

```
User 1:1 CleanerProfile
User 1:N Booking (customer)
Booking N:1 ServiceType
Booking N:N AddOn
Booking 1:N Assignment
Assignment N:1 CleanerProfile
Booking 1:N Payment
Booking 1:N Message
Booking 1:1 Review
```

---

## 🌐 API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/reset-password` - Reset password

### Bookings
- `GET /api/bookings` - List user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `POST /api/bookings/[id]/cancel` - Cancel booking
- `POST /api/bookings/[id]/review` - Submit review

### Services
- `GET /api/service-types` - List services
- `GET /api/add-ons` - List add-ons

### Payments
- `POST /api/create-payment-intent` - Create Stripe intent
- `POST /api/webhooks/stripe` - Stripe webhooks

### Cleaner
- `GET /api/cleaner/jobs` - Available jobs
- `POST /api/cleaner/jobs/[id]/accept` - Accept job
- `POST /api/cleaner/jobs/[id]/complete` - Complete job
- `GET /api/cleaner/earnings` - Earnings data
- `POST /api/cleaner/create-account-link` - Stripe onboarding

### Admin
- `GET /api/admin/bookings` - All bookings
- `POST /api/admin/refunds` - Process refunds
- `GET/POST /api/admin/settings/*` - Platform settings

### Notifications
- `GET /api/notifications/stream` - SSE notifications
- `POST /api/notifications/[id]/read` - Mark as read
- `POST /api/push/subscribe` - Push subscription

---

## 👥 User Flows

### Customer Booking Flow
```
1. /book              → Select service type
2. /book/details      → Home size + add-ons
3. /book/schedule     → Date & time
4. /book/address      → Service address
5. /book/review       → Review + payment
6. /book/success      → Confirmation
```

### Cleaner Onboarding Flow
```
1. /become-a-pro           → Landing page
2. /cleaner/onboarding     → Basic info
3. /cleaner/onboarding/identity → SSN verification
4. /cleaner/onboarding/documents → Upload ID/Insurance
5. /cleaner/onboarding/social → Social profiles
6. /cleaner/onboarding/account → Stripe Connect
7. /cleaner/onboarding/submit → Submit for review
```

### Admin Verification Flow
```
1. /admin/users/cleaner      → Pending cleaners list
2. /admin/users/cleaner/[id] → Review application
3. Approve/Reject            → Update status
```

---

## 🔧 Admin Panel

Access: `/admin`

### Sections

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard overview |
| `/admin/bookings` | Booking management |
| `/admin/users` | User management |
| `/admin/users/cleaner` | Cleaner applications |
| `/admin/services` | Service type management |
| `/admin/add-ons` | Add-ons management |
| `/admin/settings` | Platform settings |
| `/admin/settings/integrations` | External services |
| `/admin/settings/email` | Email templates |
| `/admin/settings/financial` | Fees & commissions |

---

## 💳 Payment System

### Stripe Connect Flow

1. **Customer pays** → Payment Intent created
2. **Stripe processes** → Webhook received
3. **Booking confirmed** → Status updated
4. **Job completed** → Transfer to cleaner
5. **Platform fee** → Retained automatically

### Fee Structure
- Platform commission: 30% (configurable)
- Stripe fees: 2.9% + $0.30

---

## 🔔 Notifications

### Types
- **Email**: Booking confirmations, reminders
- **SMS**: Via Twilio (optional)
- **Push**: Web Push notifications
- **Real-time**: Server-Sent Events (SSE)

### SSE Endpoint
```javascript
// Client-side
const eventSource = new EventSource('/api/notifications/stream');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle notification
};
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy

### Docker

```dockerfile
# Dockerfile provided
docker build -t fixelo .
docker run -p 3000:3000 fixelo
```

### Database

Use any PostgreSQL provider:
- Supabase
- Neon
- Railway
- PlanetScale (with adapter)

---

## 📊 Key Metrics

### Platform Health
- Active cleaners
- Total bookings
- GMV (Gross Merchandise Value)
- Average rating
- Completion rate

### Business Metrics
- Revenue (platform fees)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Churn rate

---

## 🔒 Security

- ✅ Password hashing (bcrypt)
- ✅ Session-based authentication
- ✅ Role-based access control
- ✅ CSRF protection
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection

---

## 📝 License

MIT License - See LICENSE file

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📧 Contact

- **Website**: fixelo.app
- **Email**: support@fixelo.app

---

*Built with ❤️ using Next.js, Prisma, and Stripe*
