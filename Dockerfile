# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DB_PATH=/app/data/songs.db
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy seed songs so the DB auto-populates on first run
COPY --from=builder /app/songs ./songs

# Data directory for SQLite volume mount
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
