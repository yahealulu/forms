#!/usr/bin/env bash
#
# archive.sh — Archives the entire project (source code only) into a zip file
# inside the `archive/` folder.
#
# Usage:
#   bash scripts/archive.sh              # default name: forms-system-YYYYMMDD-HHMMSS.zip
#   bash scripts/archive.sh my-name      # custom name: archive/my-name.zip
#
# Excludes: node_modules, .next, dev.log, server.log, archive/, tests/,
# upload/, download/, *.db, and other generated/non-essential files.
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_DIR="${PROJECT_ROOT}/archive"
mkdir -p "${ARCHIVE_DIR}"

# Build the archive name
if [[ $# -ge 1 && -n "$1" ]]; then
  ARCHIVE_NAME="$1"
else
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  ARCHIVE_NAME="forms-system-${TIMESTAMP}"
fi

# Ensure .zip extension
[[ "${ARCHIVE_NAME}" == *.zip ]] || ARCHIVE_NAME="${ARCHIVE_NAME}.zip"

ARCHIVE_PATH="${ARCHIVE_DIR}/${ARCHIVE_NAME}"

echo "📦  أرشفة المشروع إلى: archive/${ARCHIVE_NAME}"
echo "    المسار الكامل: ${ARCHIVE_PATH}"
echo ""

# Create the zip from the project root, excluding non-essential files.
cd "${PROJECT_ROOT}"

zip -r -q "${ARCHIVE_PATH}" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x "archive/*" \
  -x "tests/*" \
  -x "upload/*" \
  -x "download/*" \
  -x "skills/*" \
  -x "agent-ctx/*" \
  -x "*.log" \
  -x "*.db" \
  -x "dev.log" \
  -x "server.log" \
  -x ".DS_Store" \
  -x "bun.lock" \
  -x "screenshot-*.png" \
  -x "tsconfig.tsbuildinfo" \
  2>/dev/null || true

# Report
if [[ -f "${ARCHIVE_PATH}" ]]; then
  SIZE="$(du -h "${ARCHIVE_PATH}" | cut -f1)"
  echo "✅  تم إنشاء الأرشيف بنجاح"
  echo "    الحجم: ${SIZE}"
  echo "    المسار: ${ARCHIVE_PATH}"
else
  echo "❌  فشل إنشاء الأرشيف" >&2
  exit 1
fi
