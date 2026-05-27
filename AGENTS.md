# AGENTS.md

> Harness Engineering 표준 root 문서 (강의 11_software+harness_engineering.pdf 양식)

## Project Overview

TidyX는 GitHub 저장소의 Issue/Pull Request를 자동으로 수집하고, AI를 활용해 다음을 수행하는 분석 플랫폼이다.

- 중복 이슈 탐지 (Jaccard 유사도 + 클러스터링)
- 우선순위 자동 분류 (HIGH/MEDIUM/LOW)
- 라벨 추천 (`bug`, `enhancement`, `documentation` 등)
- GitHub OAuth 기반 인증 및 저장소 연동

프로토타입 단계의 모노레포 (Frontend + Backend)이며, Harness Engineering 원칙을 따른다.

## Environment

| 항목 | 사양 |
|------|------|
| Node.js | 18 이상 |
| 패키지 매니저 | npm 9 이상 |
| OS | Windows / macOS / Linux |
| DB (개발) | SQLite (`backend/prisma/dev.db`) |
| DB (운영) | PostgreSQL (예정) |
| Frontend Framework | React 18 + Vite 5 + TypeScript 5 |
| Backend Framework | NestJS 10 + Prisma 6 |
| AI 모델 | OpenAI `gpt-4.1-mini` (기본) |
| 외부 API | GitHub REST API v2022-11-28 |
| 포트 | Backend `3000`, Frontend `5173` |

필수 환경 변수: [backend/.env.example](backend/.env.example), [frontend/.env.example](frontend/.env.example) 참조.

## Project Structure

```
skills-main/                       # 모노레포 루트
├── AGENTS.md                      # 이 문서
├── backend/                       # NestJS API 서버
│   ├── src/
│   │   ├── auth/                  # GitHub OAuth, 세션
│   │   ├── repositories/          # 저장소 연동·동기화
│   │   ├── analysis/              # 중복·우선순위·라벨 분석
│   │   ├── items/                 # Issue/PR 액션 (close 등)
│   │   ├── github/                # GitHub API 클라이언트
│   │   ├── health/                # 헬스체크
│   │   └── common/                # 공유 유틸·필터·DTO
│   ├── prisma/schema.prisma       # DB 스키마
│   └── jest.config.js
├── frontend/                      # React UI
│   └── src/
│       ├── features/              # auth / repositories / items / console / projects
│       ├── shared/                # 공용 hook / type / util
│       └── infrastructure/        # HTTP 클라이언트
├── docs/
│   ├── adr/                       # Architecture Decision Records
│   └── ui/                        # UI 화면 명세
├── test/                          # QA 테스트 문서 (test-<num>-<name>.md)
├── todo/                          # 진행 중 작업 트래킹 (todo-<num>-<date>.md)
├── scripts/                       # 자동화 Bash 스크립트
└── skills/                        # 반복 작업 SKILL 모음
    └── tidyx/                     # TidyX 전용 skill
```

## Code Conventions

### Backend (NestJS)
- 디렉터리: feature 기반 (`auth/`, `repositories/`, ...)
- 한 feature는 `controller.ts` + `service.ts` + `dto/` + `__tests__/` + `__fixtures__/` 구조
- DTO에 `class-validator` 데코레이터로 입력 검증
- DB 접근은 항상 `PrismaService` 경유, controller에서 직접 호출 금지
- HTTP 응답은 `ApiExceptionFilter`가 통일된 포맷으로 변환

### Frontend (React)
- 디렉터리: `features/<name>/{components,api,services,hooks,types,__tests__}`
- 공유 자원은 `shared/`에, HTTP/스토리지는 `infrastructure/`에
- API 호출은 `infrastructure/http/client.ts`의 `request()` 단일 진입점만 사용
- 상태는 React state + custom hook (Redux 등 도입 X)

### 의존성 방향 (단방향, 역방향 금지)
- Backend: `Controller → Service → Prisma/외부API`
- Frontend: `Page/Component → Hook → Service → API → Infrastructure`

### Lint / Format
- ESLint + Prettier (각 패키지 자체 설정)
- Commit 메시지: `[TYPE](scope): 설명` 형식 (`feat`/`fix`/`docs`/`test`/`refactor`/`chore`)

### Testing
- Backend: Jest (`__tests__/*.spec.ts`)
- Frontend: Vitest (`__tests__/*.test.tsx`)
- 모든 비즈니스 로직은 단위 테스트 작성 권장
- 테스트 케이스 명세는 [test/](test/) 폴더에 별도 작성 (실행 코드와 분리)

## Constraints

### 외부 의존성 (있어야 동작)
- **GitHub OAuth App**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` 필수. 없으면 모든 로그인 흐름 실패.
- **OpenAI API Key**: `OPENAI_API_KEY` 필수. 없으면 분석은 휴리스틱 fallback으로만 동작 (정확도 낮음).
- **인터넷 연결**: GitHub API, OpenAI API 둘 다 외부 호출.

### 기능적 제약
- 저장소 동기화는 `state=all`로 GitHub Issue/PR 100개/페이지씩 모두 가져옴 (대형 저장소 주의)
- 분석은 이슈당 OpenAI 1회 호출 (이슈 100개 = LLM 100회)
- OAuth state는 **메모리 저장** → 서버 재시작 시 진행 중인 로그인 흐름 깨짐 ([adr-003 참조](docs/adr/adr-003-oauth-state-in-memory.md))
- 라벨링은 "추천"만 함, GitHub에 자동 적용하지 않음 ([adr-004 참조](docs/adr/adr-004-llm-call-pattern.md))
- Projects 기능은 Frontend localStorage 전용 (백엔드 API 없음)

### 운영적 제약
- 프로토타입 단계: 멀티 인스턴스/스케일아웃 미지원
- 인증 토큰 만료 처리 없음 (수동 재로그인 필요)
- E2E 테스트·모니터링·CI 자동 배포 없음

### 보안적 제약
- `.env` 파일은 절대 commit 금지 (`.gitignore`로 보호)
- 모든 보호 endpoint는 `tidyx_uid` 쿠키 + `CurrentUserId` 데코레이터로 인증
- 다른 사용자의 자원 접근 시 `getOwnedRepositoryOrThrow`/`getOwnedWorkItemOrThrow` 가드 통과 필수

## References

- 강의 자료: [소프트웨어 공학/8_software_testing.pdf, 11_software+harness_engineering.pdf](../소프트웨어%20공학/)
- 프로젝트 가이드: [HARNESS_ENGINEERING.md](HARNESS_ENGINEERING.md), [MONOREPO_GUIDE.md](MONOREPO_GUIDE.md)
- API 문서: http://localhost:3000/docs (Swagger UI, 서버 기동 시)
- ADR 인덱스: [docs/adr/](docs/adr/)
- UI 명세 인덱스: [docs/ui/](docs/ui/)
- QA 테스트 인덱스: [test/README.md](test/README.md)
