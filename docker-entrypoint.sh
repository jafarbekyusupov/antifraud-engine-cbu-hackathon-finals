#!/bin/sh
set -eu

result_directory="${RESULT_DIR:-/app/natija}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$result_directory"
  chown -R node:node "$result_directory"
  exec su-exec node "$@"
fi

exec "$@"
