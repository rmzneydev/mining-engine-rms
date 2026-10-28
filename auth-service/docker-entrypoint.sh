#!/bin/sh
set -eu

attempts=0
until npx prisma migrate deploy; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 30 ]; then
    echo "Database migrations failed after $attempts attempts" >&2
    exit 1
  fi
  echo "Waiting for the database and retrying migrations ($attempts/30)..."
  sleep 2
done

node dist/seed.js
exec node dist/server.js
