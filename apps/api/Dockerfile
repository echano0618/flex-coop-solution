# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies and build
RUN npm install
RUN npm run --workspace=@flexcoop/shared-types build
RUN npm run --workspace=@flexcoop/cda-coa build
RUN npm run --workspace=@flexcoop/db-migrations build
RUN npm run --workspace=@flexcoop/api build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
