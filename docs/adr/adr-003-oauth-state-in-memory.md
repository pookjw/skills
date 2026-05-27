# adr-003-oauth-state-in-memory.md

## Title: ADR-003 OAuth state를 메모리 Map에 저장

## Context

GitHub OAuth 흐름은 CSRF 방지를 위해 `state` 파라미터를 사용한다. 로그인 URL 발급 시 서버가 랜덤 state를 생성·저장하고, 콜백 시 동일 state가 돌아오는지 검증해야 한다.

저장 위치 옵션:
1. **In-memory `Map<state, expiresAt>`**
2. **DB (Prisma 테이블)**
3. **외부 캐시 (Redis 등)**
4. **쿠키 (state를 쿠키에도 같이 넣고 비교)**

프로토타입 단계에서 단일 인스턴스로만 동작하면 충분하며, 외부 의존성을 늘리고 싶지 않다.

## Decision

옵션 1 (**in-memory `Map`**)을 채택한다. [auth.service.ts:14](../../backend/src/auth/auth.service.ts#L14)에 `stateStore` 필드로 유지. TTL은 10분 ([session.constants.ts](../../backend/src/common/auth/session.constants.ts)의 `OAUTH_STATE_TTL_MS`).

## Status

accepted (프로토타입 한정), **운영 전환 시 재검토 필수**

## Consequence

### 긍정
- 외부 의존성 0, 셋업 단순
- 코드량 최소 (3줄)
- 응답 속도 빠름 (메모리 접근)

### 부정 — 명시적으로 알아두어야 할 한계
- **서버 재시작 시 모든 진행 중 OAuth 흐름이 깨짐** — 사용자가 GitHub 로그인 화면에 있는 동안 백엔드를 재시작하면 `Invalid state` 에러 발생
- **만료된 state가 자동 정리되지 않음** — 사용 안 된 state는 영원히 메모리에 남아 누수 가능 (장시간 운영 시 누적)
- **멀티 인스턴스 환경 미지원** — 인스턴스 A에서 발급한 state를 인스턴스 B가 모름 → 콜백이 다른 인스턴스로 라우팅되면 실패

### 결정에 따른 추가 작업
- AGENTS.md의 Constraints 섹션에 명시 (완료)
- 운영 전환 시 옵션 3(Redis) 또는 옵션 2(DB)로 마이그레이션. 새 ADR 작성.
- 만료 state 주기적 정리 cron 추가 검토 (단기 보완책)
