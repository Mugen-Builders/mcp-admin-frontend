#!/bin/sh
set -eu

# Default matches docker-compose `admin-api` service; Fly sets VITE_ADMIN_API_BASE_URL via secrets.
# nginx proxy_pass must be a full URL with a scheme. Bare hostnames (common secret mistakes) break with
# "invalid URL prefix" — normalize when scheme is missing.
url="${VITE_ADMIN_API_BASE_URL:-http://admin-api:8000}"
case "$url" in
    http://*|https://*) ;;
    localhost*|127.0.0.1*) url="http://$url" ;;
    *) url="https://$url" ;;
esac

# Must export: envsubst is a child process and only sees exported variables.
export VITE_ADMIN_API_BASE_URL="$url"

envsubst '${VITE_ADMIN_API_BASE_URL}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

envsubst '${VITE_ADMIN_API_BASE_URL}' \
  < /usr/share/nginx/html/config.template.js \
  > /usr/share/nginx/html/config.js
