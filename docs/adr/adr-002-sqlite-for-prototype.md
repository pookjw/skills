# adr-002-sqlite-for-prototype.md

## Title: ADR-002 프로토타입 단계 DB로 SQLite 채택

## Context

TidyX는 사용자 정보, OAuth 토큰, 연결된 저장소, 동기화 잡, Issue/PR, 분석 결과 등 8개 모델을 영속화해야 한다. DB 선택지는 다음과 같았다.

1. **SQLite**: 파일 기반, 설치 불필요
2. **PostgreSQL**: 운영 표준
3. **In-memory + JSON 파일**: 가장 단순

프로토타입은 개발자가 `git clone → npm install → npm run dev` 만으로 실행 가능해야 하며, DB 서버 설치/설정 단계가 진입 장벽이 되면 안 된다.

## Decision

**개발/프로토타입에는 SQLite**(`backend/prisma/dev.db`), **운영 배포에는 PostgreSQL**로 분리한다.

Prisma의 datasource provider만 바꾸면 동일 스키마로 양쪽 지원 가능하다는 점을 활용한다.

## Status

accepted

## Consequence

### 긍정
- 개발 환경 설정 단계 최소화 (`npm run prisma:db:push` 한 번)
- DB 파일 삭제로 손쉬운 리셋 (`rm backend/prisma/dev.db`)
- 외부 의존성 0 — CI 환경에서도 별도 컨테이너 불필요

### 부정
- 동시 쓰기 성능 제한 (멀티 인스턴스 운영 불가)
- 일부 PostgreSQL 전용 기능 사용 불가 (JSONB, full-text search, ARRAY 등)
- 운영 환경으로 마이그레이션 시 데이터 이전 절차 필요

### 결정에 따른 추가 작업
- `schema.prisma`에서 PostgreSQL 호환 타입만 사용 (예: 배열 대신 JSON 문자열)
- 운영 전환 시 [adr-XXX](./) 별도 작성 예정
- `.env`에 `DATABASE_URL` 환경변수 도입하여 provider 전환 자동화 검토
