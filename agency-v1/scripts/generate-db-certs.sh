#!/bin/bash
# Script to generate CA and SSL/TLS certificates for Postgres and PgBouncer
set -e

CERT_DIR="certs/db"
mkdir -p "$CERT_DIR"

echo "=== Generating Database SSL Certificates ==="

# 1. Generate CA key and self-signed certificate
echo "Generating CA..."
openssl req -new -x509 -days 3650 -nodes -text \
  -out "$CERT_DIR/ca.crt" \
  -keyout "$CERT_DIR/ca.key" \
  -subj "/CN=db-root-ca"

# 2. Generate Postgres Server key and certificate
echo "Generating Postgres Server certs..."
openssl req -new -nodes -text \
  -out "$CERT_DIR/server.req" \
  -keyout "$CERT_DIR/server.key" \
  -subj "/CN=postgres"

openssl x509 -req -in "$CERT_DIR/server.req" \
  -CA "$CERT_DIR/ca.crt" \
  -CAkey "$CERT_DIR/ca.key" \
  -CAcreateserial \
  -out "$CERT_DIR/server.crt" \
  -days 3650

# 3. Generate PgBouncer key and certificate
echo "Generating PgBouncer Server certs..."
openssl req -new -nodes -text \
  -out "$CERT_DIR/pgbouncer.req" \
  -keyout "$CERT_DIR/pgbouncer.key" \
  -subj "/CN=pgbouncer"

openssl x509 -req -in "$CERT_DIR/pgbouncer.req" \
  -CA "$CERT_DIR/ca.crt" \
  -CAkey "$CERT_DIR/ca.key" \
  -CAcreateserial \
  -out "$CERT_DIR/pgbouncer.crt" \
  -days 3650

# Clean up signing requests
rm -f "$CERT_DIR"/*.req "$CERT_DIR"/*.srl

# 4. Set secure permissions
echo "Setting permissions..."
chmod 644 "$CERT_DIR"/*.crt
chmod 644 "$CERT_DIR"/*.key

# If running on Linux/VPS, adjust ownership for Postgres container (UID 999)
if [ "$(id -u)" -eq 0 ]; then
  chown -R 999:999 "$CERT_DIR"
  echo "Ownership updated to 999:999 for Docker compatibility"
fi

echo "=== SSL Certificates Generated Successfully in $CERT_DIR ==="
ls -l "$CERT_DIR"
