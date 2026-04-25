# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# Note: VITE_API_URL will default to /api for unified hosting
RUN VITE_API_URL=/api npm run build

# Stage 2: Build Backend
FROM node:20-slim AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./

# Stage 3: Final Image
FROM node:20-slim
WORKDIR /app
COPY --from=backend-builder /app/server ./server
COPY --from=frontend-builder /app/client/dist ./client/dist

WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
