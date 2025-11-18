# API Service Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN cd apps/api && pnpm db:generate

# Builder stage
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source files
COPY . .

# Build the application
RUN cd apps/api && pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3001

CMD ["pnpm", "start"]
