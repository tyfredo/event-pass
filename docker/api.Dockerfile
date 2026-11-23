# Etapa 1: Compilación
FROM node:24-alpine AS builder
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm install
COPY apps/api/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/src/server.js"]