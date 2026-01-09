# Fixelo - Docker Setup com Traefik

Este documento descreve a configuração Docker completa do projeto Fixelo com Traefik, PostgreSQL e hot reload.

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Domínio fixelo.app apontando para o servidor (DNS A record)

## 🚀 Configuração Inicial

### 1. Configurar DNS no Cloudflare

1. Acesse o painel do Cloudflare
2. Adicione um registro DNS tipo **A**:
   - **Nome**: `fixelo`
   - **Conteúdo**: IP do servidor
   - **Proxy**: Desativado (DNS Only) ou Ativado (se usar Cloudflare Proxy)
   - **TTL**: Auto

### 2. Configurar Variáveis de Ambiente

O arquivo `.env` já foi criado com valores padrão. **IMPORTANTE**: Altere as senhas antes de usar em produção:

```bash
# Edite o arquivo .env
nano .env
```

Variáveis importantes:
- `POSTGRES_PASSWORD`: Senha do banco de dados PostgreSQL
- `NEXTAUTH_SECRET`: Secret para NextAuth (já gerado automaticamente)
- `NEXTAUTH_URL`: URL pública da aplicação (https://fixelo.app)

### 3. Configurar SSL/TLS

O Traefik está configurado para usar Let's Encrypt com TLS Challenge. Certifique-se de que:

- A porta 80 e 443 estão abertas no firewall
- O domínio fixelo.app aponta para o servidor
- O email em `docker-compose.yml` (admin@innexar.app) está correto

## 🏃 Iniciar os Serviços

### Primeira execução

```bash
cd /projetos/fixelo

# Criar diretório para certificados SSL
mkdir -p traefik/letsencrypt
chmod 600 traefik/letsencrypt

# Iniciar containers
docker-compose up -d

# Ver logs
docker-compose logs -f web
```

### Executar Migrações do Banco de Dados

Após os containers iniciarem, execute as migrações:

```bash
# Executar migrações
docker-compose exec web npm run db:migrate

# Popular banco com dados iniciais (opcional)
docker-compose exec web npm run db:seed
```

## 📦 Estrutura dos Serviços

### Traefik (Reverse Proxy)
- **Container**: `fixelo-traefik`
- **Portas**: 
  - 80 (HTTP, redireciona para HTTPS)
  - 443 (HTTPS)
  - 8080 (Dashboard Traefik - http://seu-ip:8080)
- **Domínio**: fixelo.app (HTTPS automático via Let's Encrypt)

### PostgreSQL (Database)
- **Container**: `fixelo-db`
- **Porta interna**: 5432
- **Volume**: `db_data` (dados persistentes)
- **Acesso**: Apenas na rede interna `fixelo-network`

### Next.js (Web Application)
- **Container**: `fixelo-web`
- **Porta interna**: 3000
- **Hot Reload**: Habilitado via volumes montados
- **Acesso**: Via Traefik em https://fixelo.app

## 🔄 Hot Reload

O hot reload está configurado através de volumes Docker:

- Código fonte montado: `.:/app`
- `node_modules` como volumes nomeados (não sobrescrevem o código)
- Next.js detecta mudanças automaticamente e recarrega

Para ver logs em tempo real:

```bash
docker-compose logs -f web
```

## 🛠️ Comandos Úteis

### Ver status dos containers
```bash
docker-compose ps
```

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Apenas web
docker-compose logs -f web

# Apenas banco
docker-compose logs -f db
```

### Reiniciar serviços
```bash
# Todos
docker-compose restart

# Apenas web
docker-compose restart web
```

### Parar serviços
```bash
docker-compose down
```

### Parar e remover volumes (⚠️ APAGA DADOS)
```bash
docker-compose down -v
```

### Acessar shell do container web
```bash
docker-compose exec web sh
```

### Executar comandos npm
```bash
# Instalar dependências
docker-compose exec web npm install

# Gerar Prisma Client
docker-compose exec web npm run db:generate

# Executar migrações
docker-compose exec web npm run db:migrate

# Executar testes
docker-compose exec web npm run test
```

## 🔍 Troubleshooting

### Certificado SSL não está sendo gerado

1. Verifique se o domínio está apontando para o servidor:
   ```bash
   dig fixelo.app +short
   ```

2. Verifique se as portas 80 e 443 estão abertas:
   ```bash
   netstat -tulpn | grep -E ':(80|443)'
   ```

3. Verifique logs do Traefik:
   ```bash
   docker-compose logs traefik | grep -i acme
   ```

### Hot reload não está funcionando

1. Verifique se os volumes estão montados corretamente:
   ```bash
   docker-compose exec web ls -la /app
   ```

2. Verifique permissões do diretório:
   ```bash
   ls -la /projetos/fixelo
   ```

### Erro de conexão com banco de dados

1. Verifique se o container do banco está rodando:
   ```bash
   docker-compose ps db
   ```

2. Verifique logs do banco:
   ```bash
   docker-compose logs db
   ```

3. Verifique se a variável DATABASE_URL está correta:
   ```bash
   docker-compose exec web printenv DATABASE_URL
   ```

### Container web não inicia

1. Verifique logs:
   ```bash
   docker-compose logs web
   ```

2. Verifique se as dependências foram instaladas:
   ```bash
   docker-compose exec web npm list
   ```

3. Reconstrua a imagem:
   ```bash
   docker-compose build --no-cache web
   docker-compose up -d web
   ```

## 📝 Notas Importantes

- **Dados do banco**: Os dados do PostgreSQL são persistidos no volume `db_data`. Não serão perdidos ao reiniciar containers.
- **Certificados SSL**: Os certificados Let's Encrypt são salvos em `./traefik/letsencrypt/`. Faça backup deste diretório.
- **Variáveis de ambiente**: Nunca commite o arquivo `.env` no git. Ele já está no `.gitignore`.
- **Produção**: Esta configuração é adequada para desenvolvimento e staging. Para produção, considere:
  - Usar secrets do Docker
  - Configurar backup automático do banco
  - Usar Cloudflare Proxy para proteção adicional
  - Configurar monitoring e alertas

## 🌐 Acessos

- **Aplicação**: https://fixelo.app
- **Traefik Dashboard**: http://seu-ip:8080 (apenas HTTP, não expor publicamente)
- **Banco de dados**: Apenas via rede interna Docker

## 📚 Documentação Adicional

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

