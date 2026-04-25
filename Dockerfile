# Production Dockerfile (Root Level)
FROM node:20-slim AS builder

WORKDIR /app
# Copy server dependencies first for optimized layer caching
COPY server/package*.json ./server/
RUN cd server && npm ci

# Copy the rest of the server code
COPY server/ ./server/

# Stage 2: Final Image
FROM node:20-slim

WORKDIR /app
# Copy only the built server code to keep the image small
COPY --from=builder /app/server ./

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
