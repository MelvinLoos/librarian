# ==========================================
# Stage 1: Build Environment
# ==========================================
FROM node:24-bookworm-slim AS builder

# Install OpenSSL (required by Prisma) and build tools (required by better-sqlite3 on ARM processors)
RUN apt-get update && apt-get install -y openssl python3 build-essential

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# FIX: Copy the Prisma schema BEFORE running npm install so the postinstall script succeeds
COPY backend/prisma ./backend/prisma

# Install ALL dependencies (frontend and backend)
RUN npm run install:all

# Copy the rest of the source code
COPY . .

# Generate the Prisma Client for the correct architecture (Safety run)
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Build the frontend and backend
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:24-bookworm-slim AS runner

# We only need OpenSSL for the runtime, no heavy build tools
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set to production mode
ENV NODE_ENV=production

# Copy built assets and node_modules from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

COPY --from=builder /app/frontend/.output ./frontend/.output

EXPOSE 3001

# Run the master start script
CMD ["npm", "run", "start"]