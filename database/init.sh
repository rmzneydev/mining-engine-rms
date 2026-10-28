#!/bin/sh
set -eu

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${AUTH_DB_NAME:?AUTH_DB_NAME is required}"
: "${AUTH_DB_USER:?AUTH_DB_USER is required}"
: "${AUTH_DB_PASSWORD:?AUTH_DB_PASSWORD is required}"
: "${BUSINESS_DB_NAME:?BUSINESS_DB_NAME is required}"
: "${BUSINESS_DB_USER:?BUSINESS_DB_USER is required}"
: "${BUSINESS_DB_PASSWORD:?BUSINESS_DB_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" <<'SQL'
\getenv auth_db AUTH_DB_NAME
\getenv auth_user AUTH_DB_USER
\getenv auth_password AUTH_DB_PASSWORD
\getenv business_db BUSINESS_DB_NAME
\getenv business_user BUSINESS_DB_USER
\getenv business_password BUSINESS_DB_PASSWORD

CREATE USER :"auth_user" WITH PASSWORD :'auth_password';
CREATE USER :"business_user" WITH PASSWORD :'business_password';

CREATE DATABASE :"auth_db" OWNER :"auth_user";
CREATE DATABASE :"business_db" OWNER :"business_user";

REVOKE ALL ON DATABASE :"auth_db" FROM PUBLIC;
REVOKE ALL ON DATABASE :"business_db" FROM PUBLIC;

GRANT CONNECT ON DATABASE :"auth_db" TO :"auth_user";
GRANT CONNECT ON DATABASE :"business_db" TO :"business_user";
SQL
