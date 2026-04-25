# Production Dockerfile
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Final Image
FROM node:20-slim

WORKDIR /app
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
