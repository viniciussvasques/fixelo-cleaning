# Fixelo - Setup Instructions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd c:\services\fixelo
npm install
```

### 2. Setup Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL if not already installed
# Create database
createdb fixelo_dev

# Update .env.local with your connection string
# DATABASE_URL="postgresql://postgres:password@localhost:5432/fixelo_dev"
```

#### Option B: Supabase (Recommended for easy setup)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string to `.env.local`

### 3. Generate NextAuth Secret

```bash
# Generate secret
openssl rand -base64 32

# Copy output to .env.local as NEXTAUTH_SECRET
```

### 4. Run Migrations & Seed

```bash
cd packages/database
npx prisma migrate dev
npx prisma db seed
```

This will create:
- 3 service types (Standard $109, Deep $169, Airbnb $129)
- 4 add-ons (Oven, Fridge, Eco, Windows)
- System configuration

### 5. Start Development Server

```bash
cd apps/web
npm run dev
```

Visit `http://localhost:3000`

---

## 📁 Project Structure

```
fixelo/
├── apps/
│   └── web/                 # Next.js application
│       ├── src/
│       │   ├── app/         # Pages (App Router)
│       │   │   ├── page.tsx              # Landing page
│       │   │   ├── auth/                 # Auth pages
│       │   │   │   ├── signup/page.tsx
│       │   │   │   └── signin/page.tsx
│       │   │   ├── book/                 # Booking flow
│       │   │   │   ├── page.tsx          # Service selection
│       │   │   │   └── details/page.tsx  # Home details
│       │   │   └── api/                  # API routes
│       │   ├── components/  # React components
│       │   ├── lib/         # Utils, auth config
│       │   └── types/       # TypeScript types
│       └── .env.local       # Environment variables
│
└── packages/
    └── database/            # Prisma + schema
        ├── prisma/
        │   ├── schema.prisma
        │   └── seed.ts
        └── src/
            └── client.ts
```

---

## 🧪 Testing the App

### Test Authentication

1. Go to `http://localhost:3000/auth/signup`
2. Create account (use any email/password)
3. Sign in with created account

### Test Booking Flow

1. Go to `http://localhost:3000/book`
2. Select a service (e.g., "Deep Cleaning")
3. Fill home details (bedrooms, bathrooms)
4. See price update in real-time

---

## 🗄️ Database Management

### View Data (Prisma Studio)

```bash
cd packages/database
npx prisma studio
```

Opens GUI at `http://localhost:5555`

### Reset Database

```bash
cd packages/database
npx prisma migrate reset
npx prisma db seed
```

---

## ✅ Current Features

- ✅ Landing page with service cards
- ✅ User authentication (signup/signin)
- ✅ Service selection page
- ✅ Home details with real-time pricing
- ✅ Database with seed data

## 🔨 In Progress

- [ ] Schedule picker
- [ ] Address input
- [ ] Add-ons selection
- [ ] Payment integration (Stripe)
- [ ] Cleaner dashboard
- [ ] Admin panel

---

## 🐛 Troubleshooting

### Database connection fails
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env.local`
- Try `npx prisma db push` to sync schema

### NextAuth errors
- Ensure NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your dev server

### Module not found errors
- Run `npm install` in root directory
- Check all packages have dependencies installed

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org/)

---

**Need help?** Check the documentation or create an issue.
