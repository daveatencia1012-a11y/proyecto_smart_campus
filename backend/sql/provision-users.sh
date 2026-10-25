#!/bin/bash
# Se ejecuta automaticamente en un volumen nuevo y manualmente en uno existente.
# No lee .env: recibe solo las variables de entorno del contenedor MySQL.
(
  set -eu
  : "${MYSQL_ROOT_PASSWORD:?Falta MYSQL_ROOT_PASSWORD}"
  declare -A seen=()
  for item in \
    campus_users:users_db:USERS_DB_PASSWORD \
    campus_requests:requests_db:REQUESTS_DB_PASSWORD \
    campus_reservations:reservations_db:RESERVATIONS_DB_PASSWORD \
    campus_resources:resources_db:RESOURCES_DB_PASSWORD \
    campus_events:events_db:EVENTS_DB_PASSWORD \
    campus_notifications:notifications_db:NOTIFICATIONS_DB_PASSWORD
  do
    IFS=: read -r account database variable <<< "$item"
    password="${!variable:-}"
    # Contraseñas generadas con openssl rand -hex 32. Validar todas antes de
    # ejecutar SQL evita interpolar caracteres SQL o configurar cuentas a medias.
    if [[ ! "$password" =~ ^[0-9a-fA-F]{64}$ ]]; then
      printf 'La variable %s debe contener 64 caracteres hexadecimales\n' "$variable" >&2
      exit 1
    fi
    if [[ "$password" == "$MYSQL_ROOT_PASSWORD" || -n "${seen[$password]+present}" ]]; then
      printf 'La contraseña de %s debe ser distinta de root y del resto de servicios\n' "$variable" >&2
      exit 1
    fi
    seen[$password]=1
  done
  for item in \
    campus_users:users_db:USERS_DB_PASSWORD \
    campus_requests:requests_db:REQUESTS_DB_PASSWORD \
    campus_reservations:reservations_db:RESERVATIONS_DB_PASSWORD \
    campus_resources:resources_db:RESOURCES_DB_PASSWORD \
    campus_events:events_db:EVENTS_DB_PASSWORD \
    campus_notifications:notifications_db:NOTIFICATIONS_DB_PASSWORD
  do
    IFS=: read -r account database variable <<< "$item"
    password="${!variable}"
    MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket --user=root <<SQL
CREATE USER IF NOT EXISTS '$account'@'%' IDENTIFIED BY '$password';
ALTER USER '$account'@'%' IDENTIFIED BY '$password';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '$account'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`$database\`.* TO '$account'@'%';
SQL
  done
)
