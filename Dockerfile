# Production Dockerfile (Server Only)
FROM node:20-slim AS builder

WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci

COPY server/ ./server/

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/server ./

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
