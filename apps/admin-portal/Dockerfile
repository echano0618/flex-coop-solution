# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=https://flexcoop-api-607281616647.asia-southeast1.run.app/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG INTERNAL_API_URL=https://flexcoop-api-607281616647.asia-southeast1.run.app
ENV INTERNAL_API_URL=${INTERNAL_API_URL}

# Copy monorepo configuration
COPY package*.json ./
COPY packages ./packages
COPY apps/admin-portal ./apps/admin-portal

# Install and build packages and Next.js portal
RUN npm install
RUN npm run --workspace=@flexcoop/shared-types build
RUN npm run --workspace=@flexcoop/cda-coa build
RUN npm run --workspace=@flexcoop/admin-portal build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=https://flexcoop-api-607281616647.asia-southeast1.run.app/api/v1
ENV INTERNAL_API_URL=https://flexcoop-api-607281616647.asia-southeast1.run.app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/admin-portal ./apps/admin-portal

WORKDIR /app/apps/admin-portal
EXPOSE 3000

CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
