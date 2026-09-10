#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly DEPLOY_HOST="captiveswar.agbert.org"
readonly DEPLOY_USER="agbert"
readonly DEPLOY_PATH="/home/agbert/domains/captiveswar.agbert.org/public_html"

for command_name in npm rsync ssh; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    exit 1
  fi
done

cd "$SCRIPT_DIR"

printf 'Building the production site...\n'
npm run build

if [[ ! -f "$SCRIPT_DIR/dist/index.html" || ! -d "$SCRIPT_DIR/dist/assets" ]]; then
  printf 'Refusing to deploy: the production build is missing index.html or assets/.\n' >&2
  exit 1
fi

readonly REMOTE_ROOT="$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"

printf 'Uploading new application assets...\n'
rsync \
  --archive \
  --compress \
  --delay-updates \
  --human-readable \
  --progress \
  --itemize-changes \
  -e ssh \
  "$SCRIPT_DIR/dist/assets/" \
  "$REMOTE_ROOT/assets/"

printf 'Publishing root files to %s/\n' "$REMOTE_ROOT"
rsync \
  --archive \
  --compress \
  --delay-updates \
  --exclude '/assets/' \
  --human-readable \
  --progress \
  --itemize-changes \
  -e ssh \
  "$SCRIPT_DIR/dist/" \
  "$REMOTE_ROOT/"

printf 'Removing obsolete application assets...\n'
rsync \
  --archive \
  --compress \
  --delete-delay \
  --delay-updates \
  --human-readable \
  --progress \
  --itemize-changes \
  -e ssh \
  "$SCRIPT_DIR/dist/assets/" \
  "$REMOTE_ROOT/assets/"

printf 'Deployment complete: https://%s\n' "$DEPLOY_HOST"
