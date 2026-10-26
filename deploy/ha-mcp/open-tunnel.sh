#!/usr/bin/env bash
set -euo pipefail
ssh -F "$HOME/.ssh/config" -fNT \
  -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -L 127.0.0.1:18086:127.0.0.1:8086 homeserver
