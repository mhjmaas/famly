# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages
COPY apps ./apps
COPY packages ./packages

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Set working directory to API app
WORKDIR /app/apps/api

# Build the API
RUN pnpm build

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init wget

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for production install
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Install production dependencies only (ignore scripts to skip husky)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Set working directory to API app
WORKDIR /app/apps/api

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/v1/health || exit 1

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
