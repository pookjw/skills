# ui-001-login.md

## Title: 로그인 화면

> 진입점: `/` (인증 안 된 상태)
> 컴포넌트: [ConsolePage.tsx:503-536](../../frontend/src/features/console/pages/ConsolePage.tsx#L503) (me === null 분기)

## Layout

```
┌─────────────────────────────────────────┐
│                                         │
│            [ TidyX 로고 ]               │
│              TidyX (h1)                 │
│   GitHub Issue 분석 및 자동 레이블링    │
│                                         │
│              ─── 또는 ───                │
│                                         │
│        [ GitHub으로 계속하기 ]           │
│                                         │
│   (에러 발생 시) 에러 메시지             │
│                                         │
└─────────────────────────────────────────┘
```

## Components

| 컴포넌트 | 역할 | 인터랙션 |
|----------|------|----------|
| `login-logo` (SVG) | TidyX 브랜드 아이콘 (블루-퍼플 그라데이션) | - |
| `h1: "TidyX"` | 제품명 | - |
| `subtitle p` | "GitHub Issue 분석 및 자동 레이블링 시스템" | - |
| `login-divider: "또는"` | (현재 무의미 — UI-001 개선 대상) | - |
| `btn-github` | GitHub OAuth 로그인 트리거 | onClick → `startGitHubLogin()` → `/auth/github/login` API 호출 → `redirectUrl`로 이동 |
| `p.error` | 로그인 실패 시 에러 표시 | - |

## User Story

**일반 사용자로서** TidyX를 처음 방문했을 때, **GitHub 계정으로 빠르게 로그인하여** 내 저장소 분석을 시작하고 싶다.

### 시나리오
1. 사용자가 `http://localhost:5173`에 접속
2. 로그인 화면 표시 (로고, 제품명, GitHub 버튼)
3. "GitHub으로 계속하기" 클릭
4. GitHub 인증 페이지로 이동
5. GitHub에서 권한 승인
6. `/auth/github/callback`으로 돌아옴 → 백엔드가 세션 쿠키 발급
7. 자동으로 `/console`로 이동 (이슈 목록 화면)

### Edge Cases
- 백엔드 다운 시: 클릭해도 응답 없음 → 빨간 에러 메시지 표시
- OAuth 도중 사용자가 GitHub에서 거부: 콜백에 `code` 없이 돌아옴 → 400 에러 → 로그인 화면 유지
- 쿠키 차단 환경: 로그인 성공 후에도 `me` 조회 실패 → 로그인 화면으로 다시 이동

### 개선 필요 사항
- "또는" 구분선이 의미 없음 (위에 다른 옵션 없음) → 제거 또는 다른 로그인 추가
- 에러 메시지 위치가 로그인 박스 밖으로 튐 → 박스 내부로 이동
