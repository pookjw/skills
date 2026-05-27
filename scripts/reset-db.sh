#!/usr/bin/env bash
# scripts/reset-db.sh
# 개발용 SQLite DB 초기화
#
# Usage: bash scripts/reset-db.sh
#
# 동작: backend/prisma/dev.db 삭제 후 prisma:db:push로 재생성

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$ROOT_DIR/backend/prisma/dev.db"

if [ -f "$DB_FILE" ]; then
  echo "==> 기존 DB 파일 삭제: $DB_FILE"
  rm "$DB_FILE"
else
  echo "==> 기존 DB 파일 없음 (skip)"
fi

echo "==> Prisma client 재생성"
(cd "$ROOT_DIR/backend" && npm run prisma:generate)

echo "==> 스키마 push (새 dev.db 생성)"
(cd "$ROOT_DIR/backend" && npm run prisma:db:push)

echo ""
echo "==> 완료. 백엔드 재시작 권장."
