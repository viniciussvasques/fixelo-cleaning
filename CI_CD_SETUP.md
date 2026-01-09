# CI/CD Configuration Guide

This document explains how to configure the CI/CD pipelines for Fixelo.

---

## 🔧 GitHub Actions Configuration

### Required Secrets

Go to **Repository Settings → Secrets and variables → Actions** and add these secrets:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `NEXTAUTH_SECRET` | Random string for NextAuth encryption | ✅ Yes |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe secret API key | ✅ Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ Yes |
| `VERCEL_TOKEN` | Vercel deployment token | For deploy |
| `VERCEL_ORG_ID` | Vercel organization ID | For deploy |
| `VERCEL_PROJECT_ID` | Vercel project ID | For deploy |
| `SNYK_TOKEN` | Snyk security scanning token | Optional |
| `TURBO_TOKEN` | Turborepo remote cache token | Optional |

### Variables

Go to **Repository Settings → Secrets and variables → Actions → Variables**:

| Variable Name | Description |
|--------------|-------------|
| `TURBO_TEAM` | Your Turborepo team name |
| `STAGING_URL` | Staging environment URL |
| `PRODUCTION_URL` | Production environment URL |

### Environments

Create these environments in **Repository Settings → Environments**:

1. **staging**
   - URL: Your staging URL
   - Protection rules: None (auto-deploy on develop)

2. **production**
   - URL: Your production URL
   - Protection rules: Required reviewers recommended

---

## 🦊 GitLab CI Configuration

### Required Variables

Go to **Settings → CI/CD → Variables** and add:

| Variable | Description | Protected | Masked |
|----------|-------------|-----------|--------|
| `NEXTAUTH_SECRET` | NextAuth encryption secret | ✅ | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ | ✅ |
| `SONAR_HOST_URL` | SonarQube server URL | ❌ | ❌ |
| `SONAR_TOKEN` | SonarQube authentication token | ✅ | ✅ |
| `STAGING_URL` | Staging environment URL | ❌ | ❌ |
| `PRODUCTION_URL` | Production environment URL | ✅ | ❌ |

---

## 🚀 Pipeline Stages

### GitHub Actions Workflow

```
install → lint → test → security → build → deploy
              ↘              ↗
               → parallel  →
```

| Stage | Description | Blocking |
|-------|-------------|----------|
| `install` | Install dependencies, generate Prisma | Yes |
| `lint` | ESLint + TypeScript check | No (warnings allowed) |
| `test` | Unit + Integration tests | No (continue on fail) |
| `security` | npm audit + Snyk scan | No (informational) |
| `build` | Build Next.js application | Yes |
| `deploy-staging` | Deploy to staging (develop branch) | Auto |
| `deploy-production` | Deploy to production (main branch) | Auto |

### GitLab CI Pipeline

| Stage | Jobs | Description |
|-------|------|-------------|
| `install` | `install` | Install deps + Prisma |
| `lint` | `lint`, `type-check` | Code quality |
| `test` | `test:unit`, `test:integration` | Testing |
| `security` | `security:audit`, `sonarqube` | Security |
| `build` | `build` | Build application |
| `deploy` | `deploy:staging`, `deploy:production` | Deployment (manual) |

---

## 🔐 Generating Secrets

### NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### VERCEL_TOKEN
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create a new token with deployment scope

### VERCEL_ORG_ID and PROJECT_ID
1. Run `vercel link` in your project directory
2. Check `.vercel/project.json` for the IDs

### SNYK_TOKEN
1. Sign up at [snyk.io](https://snyk.io)
2. Go to Account Settings → API Token

### TURBO_TOKEN
```bash
npx turbo login
npx turbo link
```

---

## 📦 Deployment Options

### Vercel (Recommended)
Currently configured. Just add the Vercel secrets.

### Docker
Build and push to registry:
```bash
docker build -t fixelo:latest -f Dockerfile.dev .
docker push your-registry/fixelo:latest
```

### Kubernetes
Apply manifests:
```bash
kubectl apply -f k8s/staging/
kubectl apply -f k8s/production/
```

---

## 🔄 Branch Strategy

| Branch | Environment | Deploy Trigger |
|--------|-------------|----------------|
| `develop` | Staging | Automatic on push |
| `main`/`master` | Production | Automatic on push |
| Feature branches | None | PR checks only |

---

## 📊 Test Coverage

GitLab CI is configured to collect test coverage. To enable:

1. Add Jest coverage config:
```json
// jest.config.js
{
  "coverageReporters": ["cobertura", "lcov", "text"]
}
```

2. Coverage reports will appear in GitLab MR widget.

---

## ❓ Troubleshooting

### Pipeline fails at Prisma generate
- Ensure `packages/database/prisma/schema.prisma` exists
- Check DATABASE_URL format

### Vercel deployment fails
- Verify VERCEL_TOKEN is valid
- Check project is linked correctly

### SonarQube timeout
- Increase timeout or allow failure
- Check SONAR_HOST_URL is accessible

---

*For more help, contact the development team.*
