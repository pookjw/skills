#!/usr/bin/env bash
# scripts/test.sh
# Backend + Frontend 테스트 일괄 실행
#
# Usage:
#   bash scripts/test.sh              # 전체 실행
#   bash scripts/test.sh backend      # 백엔드만
#   bash scripts/test.sh frontend     # 프론트엔드만

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-all}"

run_backend() {
  echo "==> Backend tests (Jest)"
  (cd "$ROOT_DIR/backend" && npm run test)
}

run_frontend() {
  echo "==> Frontend tests (Vitest)"
  (cd "$ROOT_DIR/frontend" && npm run test -- --run)
}

case "$TARGET" in
  backend)  run_backend ;;
  frontend) run_frontend ;;
  all)      run_backend; run_frontend ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Usage: $0 [all|backend|frontend]"
    exit 1
    ;;
esac

echo ""
echo "==> 테스트 완료"
