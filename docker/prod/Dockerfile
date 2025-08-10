# ---------- Build Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---------- Production Stage ----------
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --ignore-scripts --omit=dev  --prefer-offline 

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/server.js"]
