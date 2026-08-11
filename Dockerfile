# ============================================
# Stage 1: deps + build
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
RUN pnpm install --frozen-lockfile || pnpm install

# ============================================
# Stage 2: build
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o bundle standalone do Next
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# ============================================
# Stage 3: runner (imagem final)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia o output standalone + public + .next/static
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Diretorio de uploads (montado via volume)
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads
VOLUME ["/app/uploads"]

# Instala pnpm e tsx globalmente para migrations/seed em runtime
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate && \
    npm install -g tsx@4.19.2

# Copia codigo-fonte e node_modules completos para permitir
# rodar `pnpm db:migrate` e `pnpm db:seed` em runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
