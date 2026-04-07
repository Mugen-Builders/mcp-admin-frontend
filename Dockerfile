# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY env.template.js /usr/share/nginx/html/config.template.js
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-config.sh
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-env-config.sh

EXPOSE 80
