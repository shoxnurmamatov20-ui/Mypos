#!/usr/bin/env bash
# MyPOS — manually trigger a per-tenant native build.
#
# Usage:
#   ./trigger-build.sh <tenant_uuid> <ios|android> [version] [build_number] [profile]
#
# Examples:
#   ./trigger-build.sh 9b1f0fc4-2e7c-4f17-9a3a-2f6a8c1d4a01 ios
#   ./trigger-build.sh 9b1f0fc4-2e7c-4f17-9a3a-2f6a8c1d4a01 android 1.2.0 42 production
#
# Requires env vars (export before running, or use direnv):
#   MYPOS_ADMIN_TOKEN — admin bearer token (sanctum: ability `apps.build`)
#   MYPOS_API_BASE    — defaults to https://api.mypos.uz/api/v1
#
# This calls the MyPOS admin endpoint, which in turn dispatches the GitHub
# Actions `eas-build.yml` workflow. The actual build happens on Expo's infra.
# This script returns immediately with the run_id.

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: trigger-build.sh <tenant_uuid> <ios|android> [version] [build_number] [profile]

Required env:
  MYPOS_ADMIN_TOKEN   bearer token with `apps.build` ability
Optional env:
  MYPOS_API_BASE      defaults to https://api.mypos.uz/api/v1
EOF
    exit "${1:-1}"
}

# --- arg parsing -------------------------------------------------------------

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage 0
fi

TENANT_ID="${1:-}"
PLATFORM="${2:-}"
VERSION="${3:-1.0.0}"
BUILD_NUMBER="${4:-1}"
PROFILE="${5:-production}"

if [ -z "$TENANT_ID" ] || [ -z "$PLATFORM" ]; then
    usage 1
fi

# UUID v4-ish sanity check.
if ! printf '%s' "$TENANT_ID" \
    | grep -Eq '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; then
    echo "error: tenant_uuid must be a UUID, got: $TENANT_ID" >&2
    exit 1
fi

case "$PLATFORM" in
    ios|android) ;;
    *)
        echo "error: platform must be 'ios' or 'android', got: $PLATFORM" >&2
        exit 1
        ;;
esac

case "$PROFILE" in
    production|preview|development) ;;
    *)
        echo "error: profile must be production|preview|development, got: $PROFILE" >&2
        exit 1
        ;;
esac

if ! printf '%s' "$BUILD_NUMBER" | grep -Eq '^[1-9][0-9]*$'; then
    echo "error: build_number must be a positive integer, got: $BUILD_NUMBER" >&2
    exit 1
fi

# --- env ---------------------------------------------------------------------

if [ -z "${MYPOS_ADMIN_TOKEN:-}" ]; then
    echo "error: MYPOS_ADMIN_TOKEN is not set. export it or use direnv." >&2
    exit 1
fi

API_BASE="${MYPOS_API_BASE:-https://api.mypos.uz/api/v1}"
URL="${API_BASE%/}/admin/apps/${TENANT_ID}/build"

# --- request -----------------------------------------------------------------

echo "POST $URL"
echo "  platform=$PLATFORM version=$VERSION build_number=$BUILD_NUMBER profile=$PROFILE"

RESPONSE_FILE=$(mktemp)
trap 'rm -f "$RESPONSE_FILE"' EXIT

HTTP_STATUS=$(curl -sS \
    -X POST \
    -H "Authorization: Bearer ${MYPOS_ADMIN_TOKEN}" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -o "$RESPONSE_FILE" \
    -w '%{http_code}' \
    --data-binary "$(cat <<JSON
{
  "platform": "${PLATFORM}",
  "version": "${VERSION}",
  "build_number": "${BUILD_NUMBER}",
  "profile": "${PROFILE}"
}
JSON
)" \
    "$URL")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
    echo "ok ($HTTP_STATUS)"
    if command -v jq >/dev/null 2>&1; then
        jq . "$RESPONSE_FILE"
    else
        cat "$RESPONSE_FILE"
    fi
    exit 0
fi

echo "error: HTTP $HTTP_STATUS" >&2
cat "$RESPONSE_FILE" >&2
exit 1
