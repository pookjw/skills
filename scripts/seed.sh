#!/usr/bin/env bash
# scripts/seed.sh
# 개발용 테스트 데이터 시드
#
# Usage: bash scripts/seed.sh
#
# 동작: backend/prisma/init.sql 을 dev.db에 적용

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$ROOT_DIR/backend/prisma/dev.db"
SEED_FILE="$ROOT_DIR/backend/prisma/init.sql"

if [ ! -f "$DB_FILE" ]; then
  echo "ERROR: DB 파일이 없습니다. 먼저 'bash scripts/reset-db.sh' 실행하세요." >&2
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "ERROR: 시드 파일이 없습니다: $SEED_FILE" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "ERROR: sqlite3 CLI가 설치되어 있지 않습니다." >&2
  echo "Windows: scoop install sqlite (또는 https://www.sqlite.org/download.html)" >&2
  exit 1
fi

echo "==> 시드 데이터 적용: $SEED_FILE → $DB_FILE"
sqlite3 "$DB_FILE" < "$SEED_FILE"

echo "==> 완료"
