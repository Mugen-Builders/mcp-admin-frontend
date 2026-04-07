# syntax=docker/dockerfile:1

ARG DEBIAN_RELEASE_NAME=trixie

ARG NGINX_VERSION=1.29
ARG NGINX_IMAGE=nginx:${NGINX_VERSION}-${DEBIAN_RELEASE_NAME}

ARG NODE_VERSION=22
ARG NODE_IMAGE=node:${NODE_VERSION}-${DEBIAN_RELEASE_NAME}-slim

FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src

RUN npm run build

FROM ${NGINX_IMAGE} AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY env.template.js /usr/share/nginx/html/config.template.js
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-config.sh
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-env-config.sh

EXPOSE 80
