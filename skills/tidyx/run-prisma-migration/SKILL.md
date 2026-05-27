---
name: run-prisma-migration
description: backend/prisma/schema.prisma 변경 후 DB와 Prisma Client를 안전하게 재생성한다.
---

## Goal

스키마 변경(컬럼 추가, 모델 추가, 관계 변경 등) 후 다음을 보장:
1. `@prisma/client`의 TypeScript 타입 최신화
2. DB(SQLite/PostgreSQL) 스키마 동기화
3. 기존 데이터 손실 시점을 사용자에게 명확히 알림

## Inputs

- 변경된 `backend/prisma/schema.prisma`
- 환경: 개발(SQLite) 또는 운영(PostgreSQL)
- 손실 허용 여부: `--reset` 플래그 (기본 false)

## Procedure

### 개발 환경 (SQLite, 데이터 손실 OK)
```bash
cd backend
npm run prisma:generate   # 1. Prisma Client TypeScript 재생성
npm run prisma:db:push    # 2. DB 스키마 동기화 (마이그레이션 파일 X)
```

- `prisma:db:push`는 마이그레이션 히스토리를 만들지 않음 (프로토타입 단계용)
- 데이터 손실이 발생할 변경(컬럼 삭제 등)이면 Prisma가 경고 출력

### 데이터 완전 초기화 필요 시
```bash
bash scripts/reset-db.sh   # DB 파일 삭제 + 재생성
bash scripts/seed.sh       # (선택) 시드 적용
```

### 운영 환경 (PostgreSQL, 데이터 보존 필요)
```bash
cd backend
npx prisma migrate dev --name <change-description>   # 마이그레이션 파일 생성
# 검토 후 prisma/migrations/<timestamp>_<name>/migration.sql 커밋
npx prisma migrate deploy                            # 운영에 적용
npm run prisma:generate
```

## Verification

- `cd backend && npx prisma validate` 통과
- `cd backend && npm run build` 통과 (타입 에러 없음)
- 백엔드 재시작 후 신규 컬럼·모델이 API 응답에 반영되는지 수동 확인
- `bash scripts/test.sh backend` 통과

## Constraints

- 운영 환경에서는 **절대 `prisma:db:push` 사용 금지** (마이그레이션 히스토리 없이 스키마가 변경되면 다른 인스턴스와 불일치 발생)
- 데이터 손실이 발생할 변경은 **반드시 ADR 작성** (`docs/adr/adr-<num>-<name>.md`)
- `schema.prisma`의 datasource는 한 번에 한 provider만 — SQLite ↔ PostgreSQL 전환 시 환경별로 분리 ([adr-002 참조](../../../docs/adr/adr-002-sqlite-for-prototype.md))
- 기존 unique 제약 추가 시 중복 데이터가 있으면 실패 — 사전 데이터 정합성 확인
