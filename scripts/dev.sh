#!/usr/bin/env bash
# scripts/dev.sh
# Frontend + Backend 동시 실행 (개발용)
#
# Usage: bash scripts/dev.sh
#
# 종료: Ctrl+C 한 번으로 양쪽 모두 종료

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> TidyX 개발 서버 시작"
echo "    Backend:  http://localhost:3000"
echo "    Frontend: http://localhost:5173"
echo "    Swagger:  http://localhost:3000/docs"
echo ""

# 백엔드 백그라운드 실행
(cd "$ROOT_DIR/backend" && npm run start:dev) &
BACKEND_PID=$!

# 프론트 백그라운드 실행
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

# Ctrl+C 시 자식 프로세스도 종료
trap "echo '==> 종료 중...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
