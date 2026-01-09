# 🚀 CHECKLIST DE PRÉ-PRODUÇÃO - FIXELO

## ✅ Código (Pronto)
- [x] Type-check passa sem erros
- [x] Build completa com sucesso (98 páginas)
- [x] CI/CD configurado (GitHub Actions + GitLab CI)
- [x] Código commitado e enviado para GitHub

---

## 🔧 VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS

Configure no servidor de pré-produção:

### Banco de Dados
```env
DATABASE_URL="postgresql://user:password@host:5432/fixelo?schema=public"
```

### Autenticação
```env
NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"
NEXTAUTH_URL="https://staging.fixelo.app"
```

### Stripe (Pagamentos)
```env
STRIPE_SECRET_KEY="sk_live_xxx ou sk_test_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx ou pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

### URL da Aplicação
```env
NEXT_PUBLIC_APP_URL="https://staging.fixelo.app"
```

### Email (SMTP)
```env
SMTP_HOST="my.mailbux.com"
SMTP_PORT="587"
SMTP_USER="no-reply@fixelo.app"
SMTP_PASSWORD="sua-senha-smtp"
SMTP_FROM="no-reply@fixelo.app"
```

### SMS (Opcional mas Recomendado)
```env
TWILIO_ACCOUNT_SID="ACxxx"
TWILIO_AUTH_TOKEN="xxx"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Push Notifications (Opcional)
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="xxx"
VAPID_PRIVATE_KEY="xxx"
```

---

## 📋 PASSOS NO SERVIDOR

### 1. Banco de Dados
```bash
# Rodar migrations
npx prisma migrate deploy

# Popular dados iniciais (opcional)
npx prisma db seed
```

### 2. Build
```bash
npm ci
npm run db:generate
npm run build
```

### 3. Iniciar
```bash
npm start
# ou com PM2
pm2 start npm --name "fixelo" -- start
```

---

## 🔒 CONFIGURAR NO STRIPE

1. **Webhook Endpoint**
   - URL: `https://staging.fixelo.app/api/webhooks/stripe`
   - Eventos necessários:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated` (para Stripe Connect)

2. **Stripe Connect**
   - Ativar conta Connect no dashboard Stripe
   - Configurar redirect URLs

---

## ⚠️ ITENS PENDENTES (Opcional mas Recomendado)

| Item | Prioridade | Status |
|------|-----------|--------|
| Configurar domínio SSL | Alta | Pendente |
| Configurar Stripe webhook | Alta | Pendente |
| Testar fluxo de pagamento | Alta | Pendente |
| Configurar backup do banco | Média | Pendente |
| Configurar monitoramento (Sentry) | Média | Opcional |
| Gerar imagem OG para compartilhamento | Baixa | Opcional |

---

## 🧪 TESTES PÓS-DEPLOY

1. [ ] Acessar página inicial
2. [ ] Criar conta de cliente
3. [ ] Fazer login
4. [ ] Iniciar fluxo de booking
5. [ ] Testar pagamento (modo teste Stripe)
6. [ ] Criar conta de cleaner
7. [ ] Aprovar cleaner no admin
8. [ ] Verificar se emails são enviados
9. [ ] Verificar se SMS são enviados (se Twilio configurado)

---

## 📞 SUPORTE

Se houver problemas:
1. Verificar logs: `pm2 logs fixelo`
2. Verificar variáveis de ambiente
3. Verificar conexão com banco de dados
4. Verificar se Stripe está configurado corretamente

---

**STATUS: PRONTO PARA DEPLOY** ✅
