#!/bin/sh
set -eu

: "${ADMIN_API_BASE_URL:=}"

envsubst '${ADMIN_API_BASE_URL}' \
  < /usr/share/nginx/html/config.template.js \
  > /usr/share/nginx/html/config.js
