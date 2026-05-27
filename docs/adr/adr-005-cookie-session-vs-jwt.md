# adr-005-cookie-session-vs-jwt.md

## Title: ADR-005 인증 방식으로 HttpOnly 쿠키 세션 채택 (JWT 대신)

## Context

GitHub OAuth 완료 후 사용자를 식별할 메커니즘이 필요하다. 옵션:

1. **HttpOnly 세션 쿠키** — 쿠키에 user_id, 서버가 DB 조회로 검증
2. **JWT (Authorization header)** — 클라이언트가 토큰을 저장하고 요청마다 헤더에 첨부
3. **JWT in HttpOnly 쿠키** — 1, 2의 절충

TidyX는 동일 브라우저에서만 동작하는 SPA(`localhost:5173` ↔ `localhost:3000`)이며, 모바일 앱이나 서드파티 API 통합 계획이 없다.

## Decision

옵션 1 (**HttpOnly 세션 쿠키**). 쿠키 이름은 `tidyx_uid`, 값은 사용자 PK(`User.id`).

- Backend가 `Set-Cookie: tidyx_uid=<id>; HttpOnly; SameSite=Lax; Max-Age=1209600` 발급 ([auth.controller.ts:49](../../backend/src/auth/auth.controller.ts#L49))
- 보호 endpoint는 `@CurrentUserId()` 데코레이터로 쿠키에서 user_id 추출 ([current-user-id.decorator.ts](../../backend/src/common/auth/current-user-id.decorator.ts))
- Frontend는 `fetch(..., { credentials: 'include' })` 옵션으로 쿠키 자동 첨부 ([http/client.ts:33](../../frontend/src/infrastructure/http/client.ts#L33))

## Status

accepted

## Consequence

### 긍정
- **XSS 안전성**: HttpOnly 플래그로 JS에서 쿠키 접근 불가
- **CSRF 대비**: SameSite=Lax로 cross-site POST 자동 차단
- **클라이언트 단순화**: 토큰 저장·갱신 로직 불필요
- **로그아웃 즉시 효과**: 서버에서 쿠키 무효화 가능 (JWT는 만료 전 무효화 어려움)

### 부정
- **세션 데이터를 서버에서 관리해야 함**: 매 요청마다 DB 조회 (현재는 cookie 값=user_id 직접 사용, DB 조회 최소화)
- **CORS 복잡도**: `credentials: 'include'` 사용 시 `Access-Control-Allow-Origin: *` 불가 → 정확한 origin 지정 필요 ([main.ts:23](../../backend/src/main.ts#L23))
- **모바일 앱 확장 시 부적합**: native 앱은 쿠키 핸들링이 번거로움

### 결정에 따른 추가 작업
- `COOKIE_SECURE=true` 환경에서 HTTPS 강제 필요 (운영 배포 시)
- 세션 무효화 endpoint (`POST /auth/logout`) 구현 완료
- 세션 만료 시(예: 사용자 삭제) 자동 로그아웃 처리 검토
- 모바일 클라이언트 추가 시 JWT 병행 도입 → 새 ADR 작성 필요
