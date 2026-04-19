#!/usr/bin/env bash
# MyPOS — UZCLOUD VPS provisioning script
# Usage (from local): ssh root@<vps-ip> "bash -s" < provision-vps.sh
#
# Prepares a fresh Ubuntu 24.04 LTS VPS:
#   - System updates + essential packages
#   - UFW firewall
#   - Fail2ban
#   - Docker + Docker Compose
#   - Coolify (self-hosted PaaS)
#   - Non-root user (with sudo)
#   - SSH hardening (key-only)
#
# Run as root. Set NEW_USER and SSH_PUBLIC_KEY env vars first.

set -euo pipefail

NEW_USER="${NEW_USER:-deploy}"
SSH_PUBLIC_KEY="${SSH_PUBLIC_KEY:-}"
HOSTNAME="${HOSTNAME:-mypos-prod}"

if [ -z "${SSH_PUBLIC_KEY}" ]; then
    echo "ERROR: SSH_PUBLIC_KEY not set"
    exit 1
fi

echo "[$(date)] === MyPOS VPS Provisioning ==="
echo "[$(date)] New user: ${NEW_USER}"
echo "[$(date)] Hostname: ${HOSTNAME}"

# ============================================================
# System update
# ============================================================
echo "[$(date)] Updating system..."
apt-get update
apt-get upgrade -y
apt-get install -y \
    curl wget ca-certificates gnupg lsb-release \
    ufw fail2ban htop iotop ncdu \
    git vim tmux \
    unattended-upgrades

# ============================================================
# Hostname + timezone
# ============================================================
hostnamectl set-hostname "${HOSTNAME}"
timedatectl set-timezone Asia/Tashkent

# ============================================================
# User setup
# ============================================================
if ! id "${NEW_USER}" &>/dev/null; then
    useradd -m -s /bin/bash -G sudo "${NEW_USER}"
    echo "${NEW_USER} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/${NEW_USER}"
    chmod 440 "/etc/sudoers.d/${NEW_USER}"
fi

mkdir -p "/home/${NEW_USER}/.ssh"
echo "${SSH_PUBLIC_KEY}" > "/home/${NEW_USER}/.ssh/authorized_keys"
chmod 700 "/home/${NEW_USER}/.ssh"
chmod 600 "/home/${NEW_USER}/.ssh/authorized_keys"
chown -R "${NEW_USER}:${NEW_USER}" "/home/${NEW_USER}/.ssh"

# ============================================================
# SSH hardening
# ============================================================
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*UsePAM.*/UsePAM no/' /etc/ssh/sshd_config
systemctl reload ssh

# ============================================================
# UFW firewall
# ============================================================
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp       # SSH
ufw allow 80/tcp       # HTTP
ufw allow 443/tcp      # HTTPS
ufw allow 8000/tcp     # Coolify UI (restrict later via Tailscale)
ufw --force enable

# ============================================================
# Fail2ban
# ============================================================
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF
systemctl enable --now fail2ban

# ============================================================
# Docker
# ============================================================
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker "${NEW_USER}"
fi

# ============================================================
# Coolify
# ============================================================
if [ ! -d /data/coolify ]; then
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
fi

# ============================================================
# Unattended security upgrades
# ============================================================
dpkg-reconfigure -plow unattended-upgrades

echo "[$(date)] === Provisioning complete ==="
echo "[$(date)] Next steps:"
echo "  1. SSH as ${NEW_USER}@<vps-ip>"
echo "  2. Visit http://<vps-ip>:8000 to configure Coolify"
echo "  3. Connect Coolify to GitHub for auto-deploy"
echo "  4. Set up PostgreSQL + Redis + MinIO services"
