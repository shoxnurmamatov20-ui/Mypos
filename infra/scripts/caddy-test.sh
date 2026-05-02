#!/usr/bin/env bash
#
# caddy-test.sh — point a fake custom domain at our local Caddy.
#
# Usage:
#   ./caddy-test.sh add    jomeburger.local
#   ./caddy-test.sh remove jomeburger.local
#
# How it works:
#   - Adds (or removes) a `127.0.0.1 <hostname>` line in /etc/hosts so the
#     hostname resolves to the local Caddy on :443.
#   - You still need to register the domain via the admin API (or seed it in
#     the `tenant_domains` table with `is_verified=true`) so Caddy's
#     on-demand TLS "ask" endpoint will return 200.
#   - Caddy will then attempt to issue a Let's Encrypt cert. For .local TLDs
#     LE will refuse — flip `acme_ca` to staging in the Caddyfile, or accept
#     the self-signed cert with `curl -k`.
#
# The script tags its lines with `# mypos-caddy-test` so removal is exact and
# nothing else in /etc/hosts gets touched.

set -euo pipefail

HOSTS_FILE="${HOSTS_FILE:-/etc/hosts}"
TAG="# mypos-caddy-test"

usage() {
    cat <<USAGE
Usage:
  $0 add    <hostname>
  $0 remove <hostname>
  $0 list

Examples:
  $0 add jomeburger.local
  curl -k https://jomeburger.local/

Note: requires sudo to edit ${HOSTS_FILE}.
USAGE
}

require_hostname() {
    if [[ -z "${1:-}" ]]; then
        echo "Error: hostname required." >&2
        usage
        exit 1
    fi
    # cheap sanity check — refuse blatant garbage
    if [[ ! "$1" =~ ^[a-zA-Z0-9.-]+$ ]] || [[ "$1" != *.* ]]; then
        echo "Error: '$1' does not look like a hostname." >&2
        exit 1
    fi
}

cmd_add() {
    local host="$1"
    require_hostname "$host"

    if grep -qE "^[^#]*\b${host}\b" "$HOSTS_FILE"; then
        echo "Already in $HOSTS_FILE: $host"
        return 0
    fi

    echo "Adding '127.0.0.1 $host' to $HOSTS_FILE (sudo required)..."
    echo "127.0.0.1 $host  $TAG" | sudo tee -a "$HOSTS_FILE" >/dev/null

    cat <<NOTES

Done. Next:
  1. Make sure the domain is registered + verified in the DB:
       INSERT INTO tenant_domains (id, tenant_id, domain, is_verified, ...)
            VALUES (gen_random_uuid(), '<tenant-uuid>', '$host', true, ...);
  2. Make sure Caddy is running:
       docker compose --profile edge up -d caddy
  3. Hit it:
       curl -k https://$host/
NOTES
}

cmd_remove() {
    local host="$1"
    require_hostname "$host"

    echo "Removing $host from $HOSTS_FILE (sudo required)..."
    # Match only lines we tagged, to avoid clobbering unrelated entries.
    sudo sed -i.bak "/${host}.*${TAG}/d" "$HOSTS_FILE"
    echo "Removed (backup at ${HOSTS_FILE}.bak)."
}

cmd_list() {
    echo "MyPOS test entries in $HOSTS_FILE:"
    grep "$TAG" "$HOSTS_FILE" || echo "  (none)"
}

case "${1:-}" in
    add)    shift; cmd_add    "${1:-}" ;;
    remove) shift; cmd_remove "${1:-}" ;;
    list)   cmd_list ;;
    *)      usage; exit 1 ;;
esac
