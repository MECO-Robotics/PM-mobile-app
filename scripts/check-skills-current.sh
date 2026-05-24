#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
TMP_DIR="${TMP_DIR:-$(mktemp -d)}"

bash "$SCRIPT_DIR/sync-skills.sh"
echo "skills/ import completed."
