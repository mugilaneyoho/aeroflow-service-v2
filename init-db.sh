#!/bin/bash
set -e

DATABASES=(
auth
institute
telecalling
training
payment
reception
notifyandlog
openvidu
content
ticket
placement
)

for db in "${DATABASES[@]}"
do
    echo "Creating database: $db"

    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<EOF
SELECT 'CREATE DATABASE $db OWNER patron'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = '$db'
)\gexec
EOF
done

echo "Done creating databases."