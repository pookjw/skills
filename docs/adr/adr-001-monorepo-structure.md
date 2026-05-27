# adr-001-monorepo-structure.md

## Title: ADR-001 모노레포(Frontend + Backend) 구조 채택

## Context

TidyX는 React 기반 UI와 NestJS 기반 API 서버, 그리고 공유 도메인 지식(이슈 우선순위, 라벨 enum 등)을 함께 다루는 프로젝트다. 초기 설계 시 다음 옵션을 검토했다.

1. **분리 저장소**: `tidyx-frontend`, `tidyx-backend` 각각 독립
2. **모노레포**: 하나의 저장소에 `frontend/`, `backend/` 폴더
3. **풀스택 프레임워크**: Next.js 같은 단일 코드베이스

프로토타입 단계에서 빠른 개발 사이클이 필요하고, 강의의 Harness Engineering 원칙에서 "Repository-based development"를 강조한다.

## Decision

옵션 2 (**모노레포**)를 채택한다. 루트에 `backend/`, `frontend/` 폴더를 두고 각자 `package.json`을 가진다. 공통 산출물(`docs/`, `test/`, `skills/`)은 루트에 둔다.

## Status

accepted

## Consequence

### 긍정
- Frontend와 Backend 변경을 같은 PR로 묶을 수 있음 (스키마-DTO 동기화 용이)
- ADR / UI 명세 / 테스트 문서를 한 곳에서 관리
- 신규 개발자는 `git clone` 한 번으로 모든 코드 접근

### 부정
- 빌드 도구가 통합되지 않음 (각 패키지에서 `npm install` 따로)
- 배포 시 두 패키지 buildoutput을 별도로 처리 필요 (`vercel.json` 별도 설정)
- 의존성 중복 가능성 (eslint, typescript 등)

### 결정에 따른 추가 작업
- 루트 `package.json` 없음 → 향후 `npm workspaces` 또는 `pnpm` 도입 검토
- `scripts/dev.sh` 등 통합 실행 스크립트 필요 (이미 추가됨)
