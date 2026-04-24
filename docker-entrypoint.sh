#!/bin/sh
set -eu

# Default matches docker-compose `admin-api` service; Fly sets VITE_ADMIN_API_BASE_URL via secrets.
# Must export: envsubst is a child process and only sees exported variables.
export VITE_ADMIN_API_BASE_URL="${VITE_ADMIN_API_BASE_URL:-http://admin-api:8000}"

envsubst '${VITE_ADMIN_API_BASE_URL}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

envsubst '${VITE_ADMIN_API_BASE_URL}' \
  < /usr/share/nginx/html/config.template.js \
  > /usr/share/nginx/html/config.js
