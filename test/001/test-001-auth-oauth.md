# test-001-auth-oauth.md

## Title: GitHub OAuth 로그인 및 세션 관리

> **Tested module**: `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`
> **Tested endpoints**: `GET /auth/github/login`, `GET /auth/github/callback`, `GET /auth/me`, `POST /auth/logout`
> **Test type**: Validation testing + Defect testing
> **Test level**: Component testing (controller ↔ service ↔ GitHub API)

---

## Case 1: 로그인 URL 발급 (Validation)

### Input
- 요청: `GET http://localhost:3000/auth/github/login`
- 사전 조건: 백엔드 서버가 기동 중이며, `.env`의 `GITHUB_CLIENT_ID`가 설정되어 있음.

### Expected Output
- HTTP 200 응답
- 응답 본문 JSON에 `loginUrl` 필드가 포함됨
- `loginUrl`은 `https://github.com/login/oauth/authorize`로 시작하고, 다음 쿼리 파라미터를 모두 포함함:
  - `client_id` (= `.env`의 `GITHUB_CLIENT_ID`)
  - `redirect_uri` (= `.env`의 `GITHUB_REDIRECT_URI`)
  - `scope` (= `repo,read:user,user:email`)
  - `state` (CSRF 방지용 랜덤 문자열)

### Acceptance Criteria
- 응답 시간 < 500ms
- `state` 값은 매 요청마다 다름 (재사용 금지)
- 모든 필수 쿼리 파라미터 누락 시 실패로 간주

---

## Case 2: OAuth 콜백 정상 처리 (Validation)

### Input
- 요청: `GET http://localhost:3000/auth/github/callback?code=<valid_code>&state=<valid_state>`
- 사전 조건: Case 1에서 발급된 `state`를 그대로 사용. `code`는 GitHub가 발급한 유효한 인가 코드.

### Expected Output
- HTTP 302 redirect 응답
- `Location` 헤더 = `.env`의 `FRONTEND_OAUTH_SUCCESS_URL` (`http://localhost:5173/console`)
- 응답 헤더에 `Set-Cookie: tidyx_session=<userId>; HttpOnly; SameSite=Lax`가 포함됨
- DB의 `User` 테이블에 GitHub 사용자 정보(`login`, `email`, `avatarUrl`)가 저장됨
- 동일 사용자 재로그인 시 새 레코드 생성 없이 기존 레코드 갱신

### Acceptance Criteria
- 쿠키 `Max-Age`는 14일(1209600초)
- 쿠키는 `HttpOnly` 플래그를 가져 JS에서 접근 불가
- `COOKIE_SECURE=true`일 때만 `Secure` 플래그 포함

---

## Case 3: 세션 쿠키로 현재 사용자 조회 (Validation)

### Input
- 요청: `GET http://localhost:3000/auth/me`
- 헤더: `Cookie: tidyx_session=<userId>` (Case 2에서 발급된 쿠키)

### Expected Output
- HTTP 200 응답
- 응답 본문에 `userId`, `login`, `email`, `avatarUrl` 필드가 포함됨
- 값은 DB에 저장된 사용자 정보와 일치

### Acceptance Criteria
- 응답 시간 < 200ms
- 응답 본문에 GitHub access token이 노출되지 **않음** (보안)

---

## Case 4: 로그아웃 시 쿠키 삭제 (Validation)

### Input
- 요청: `POST http://localhost:3000/auth/logout`
- 헤더: `Cookie: tidyx_session=<userId>`

### Expected Output
- HTTP 204 No Content 응답
- 응답 헤더에 `Set-Cookie: tidyx_session=; Max-Age=0` 또는 동등한 만료 처리가 포함됨
- 이후 `GET /auth/me` 호출 시 401 Unauthorized

### Acceptance Criteria
- 쿠키 삭제 후 DB의 사용자 레코드는 **유지**되어야 함 (재로그인 시 동일 user_id 사용)

---

## Case 5: 잘못된 state로 콜백 호출 (Defect / Security)

### Input
- 요청: `GET http://localhost:3000/auth/github/callback?code=<valid_code>&state=invalid_state_xyz`

### Expected Output
- HTTP 400 Bad Request 응답
- 응답 본문에 에러 메시지 포함 (예: `"Invalid state parameter"`)
- 쿠키 발급 안 됨
- DB에 신규 사용자 레코드 생성 안 됨

### Acceptance Criteria
- CSRF 공격 방지를 위해 반드시 거부되어야 함
- 에러 응답에 내부 스택 트레이스나 민감한 정보가 노출되지 않음

---

## Case 6: 만료된/잘못된 code로 콜백 호출 (Defect)

### Input
- 요청: `GET http://localhost:3000/auth/github/callback?code=expired_or_fake_code&state=<valid_state>`

### Expected Output
- HTTP 400 또는 401 응답
- 응답 본문에 GitHub API의 에러 사유가 사용자 친화적으로 변환되어 포함

### Acceptance Criteria
- GitHub API 응답 에러를 그대로 노출하지 않음 (래핑 필수)
- 동일한 `state`로 재시도해도 거부됨 (state는 일회용)

---

## Case 7: 쿠키 없이 /auth/me 호출 (Defect)

### Input
- 요청: `GET http://localhost:3000/auth/me`
- 헤더: Cookie 없음

### Expected Output
- HTTP 401 Unauthorized 응답
- 응답 본문에 에러 메시지 포함

### Acceptance Criteria
- 인증 가드가 누락된 쿠키를 정확히 차단함
- 응답에 빈 사용자 객체(`{}`)를 반환하지 않음
