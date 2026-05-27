---
name: add-feature-module
description: TidyX 백엔드(NestJS)와 프론트엔드(React) 양쪽에 동일 이름의 새 feature 모듈을 일관된 구조로 추가한다.
---

## Goal

신규 기능(예: `comments`, `assignees`, `notifications`)을 TidyX에 추가할 때, AGENTS.md의 Code Conventions와 일치하는 디렉토리·파일 골격을 자동으로 만든다.

## Inputs

- `<feature-name>`: 모듈 이름 (kebab-case, 예: `comments`)
- 추가할 측: `backend`, `frontend`, 또는 `both` (기본 `both`)

## Procedure

### 1. Backend (`backend/src/<feature-name>/`)
다음 파일들 생성:
```
backend/src/<feature-name>/
├── <feature-name>.controller.ts     # @Controller(<name>) with @ApiTags
├── <feature-name>.service.ts        # @Injectable, PrismaService 주입
├── dto/
│   └── <feature-name>.dto.ts        # class-validator 적용
├── __tests__/
│   └── <feature-name>.service.spec.ts   # Jest, AAA 패턴
└── __fixtures__/
    └── sample-<feature-name>.ts     # 테스트 mock 데이터
```
- `backend/src/app.module.ts`에 controller·service 등록 추가

### 2. Frontend (`frontend/src/features/<feature-name>/`)
```
frontend/src/features/<feature-name>/
├── api/
│   ├── <feature-name>.api.ts        # request() 래퍼
│   └── index.ts
├── services/
│   └── <feature-name>Service.ts     # 비즈니스 로직
├── components/                       # 필요 시
│   └── <FeatureName>List.tsx
├── hooks/
│   └── use<FeatureName>.ts          # 필요 시
├── types/
│   └── <feature-name>.types.ts
└── __tests__/
    └── <feature-name>Service.test.ts
```
- 신규 타입은 `frontend/src/shared/types/api.ts`에도 export

### 3. 문서 갱신
- `AGENTS.md` Project Structure 섹션 갱신
- `docs/adr/`에 설계 결정 ADR 추가 (필요 시)
- `docs/ui/`에 UI 명세 추가 (UI 변경 동반 시)
- `test/`에 QA 명세 추가

## Verification

- `cd backend && npm run build` 통과
- `cd frontend && npm run build` 통과
- `bash scripts/test.sh` 통과 (신규 테스트 포함)
- `bash scripts/dev.sh`로 양쪽 기동 시 새 endpoint가 Swagger(`/docs`)에 노출됨

## Constraints

- 모듈 이름은 **kebab-case**, 한 단어 또는 두 단어 이내
- 기존 feature와 동일 이름 사용 금지 (`auth`, `repositories`, `analysis`, `items`, `github`, `health`, `console`, `projects`)
- 양쪽에 추가 시 **이름 동일성 유지** (백엔드 endpoint와 프론트 feature 매칭 명확화)
- DB 모델 추가 시 [adr-002](../../../docs/adr/adr-002-sqlite-for-prototype.md)의 제약 (SQLite/PostgreSQL 호환 타입만) 준수
