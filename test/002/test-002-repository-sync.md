# test-002-repository-sync.md

## Title: GitHub 저장소 연동 및 이슈/PR 동기화

> **Tested module**: `backend/src/repositories/repositories.controller.ts`, `backend/src/repositories/repositories.service.ts`, `backend/src/github/github-repos.controller.ts`
> **Tested endpoints**: `GET /github/repos`, `GET /repos`, `POST /repos`, `DELETE /repos/:id`, `POST /repos/:id/sync`, `POST /repos/:id/sync-jobs`, `GET /repos/:id/sync-jobs/latest`, `GET /repos/:id/items`
> **Test type**: Validation testing + Defect testing
> **Test level**: System testing (controller ↔ service ↔ DB ↔ GitHub API)

---

## Case 1: 로그인한 사용자의 GitHub 저장소 목록 조회 (Validation)

### Input
- 요청: `GET http://localhost:3000/github/repos`
- 헤더: `Cookie: tidyx_session=<userId>` (test-001 Case 2 통과 후 발급된 쿠키)

### Expected Output
- HTTP 200 응답
- 응답 본문 `{ items: [...], total: N }`
- 각 항목은 `id`, `fullName`, `owner`, `name`, `isPrivate`, `defaultBranch` 필드를 포함
- `total`은 `items.length`와 일치

### Acceptance Criteria
- GitHub API 페이지네이션이 적용되어 모든 접근 가능한 저장소가 반환됨
- 사용자가 권한 없는 저장소는 응답에 포함되지 않음

---

## Case 2: 저장소 연동 (Validation)

### Input
- 요청: `POST http://localhost:3000/repos`
- 헤더: `Cookie: tidyx_session=<userId>`, `Content-Type: application/json`
- 본문: `{ "fullName": "octocat/Hello-World" }`

### Expected Output
- HTTP 201 Created
- 응답 본문에 `id`, `fullName`, `owner`, `name`, `isPrivate`, `defaultBranch`, `lastSyncedAt`(null) 포함
- DB의 `ConnectedRepository` 테이블에 신규 레코드 생성

### Acceptance Criteria
- 동일 사용자가 같은 저장소를 중복 연동 시 409 Conflict 또는 멱등 처리
- `fullName`은 `owner/repo` 형식이어야 함

---

## Case 3: 연동된 저장소 목록 조회 (Validation)

### Input
- 요청: `GET http://localhost:3000/repos`
- 헤더: `Cookie: tidyx_session=<userId>`

### Expected Output
- HTTP 200 응답
- 응답 본문 `{ items: [...], total: N }`
- Case 2에서 연동한 저장소가 `items`에 포함됨
- 다른 사용자가 연동한 저장소는 포함되지 **않음**

### Acceptance Criteria
- 사용자별 데이터 격리 (multi-tenant 보안)

---

## Case 4: 동기 동기화 실행 (Validation)

### Input
- 요청: `POST http://localhost:3000/repos/{repoId}/sync`
- 헤더: `Cookie: tidyx_session=<userId>`
- 사전 조건: Case 2에서 연동한 저장소의 `repoId` 사용

### Expected Output
- HTTP 200 응답
- 응답 본문: `{ repositoryId, totalFetched, openCount, closedCount, syncedAt }`
- `openCount + closedCount = totalFetched`
- DB의 `WorkItem` 테이블에 이슈와 PR이 저장됨
- `ConnectedRepository.lastSyncedAt` 갱신

### Acceptance Criteria
- 같은 이슈를 두 번 sync해도 중복 레코드 없음 (upsert)
- GitHub의 `updated_at`이 DB와 다른 경우만 갱신
- 응답 시간 < 30초 (저장소 크기에 따라 조정)

---

## Case 5: 비동기 동기화 잡 시작 및 진행률 조회 (Validation)

### Input
- 요청 1: `POST http://localhost:3000/repos/{repoId}/sync-jobs`
- 요청 2 (즉시 폴링): `GET http://localhost:3000/repos/{repoId}/sync-jobs/latest`
- 헤더: `Cookie: tidyx_session=<userId>`

### Expected Output
- 요청 1: HTTP 201, 응답 본문에 `jobId`, `status: "PENDING"` 또는 `"RUNNING"`
- 요청 2: HTTP 200, `status`가 `PENDING → RUNNING → SUCCEEDED` 순으로 변화
- 완료 시 `progressPercent = 100`, `finishedAt`이 설정됨

### Acceptance Criteria
- 동일 저장소에 대해 동시 잡 2개 시작 시 충돌 처리 (큐잉 또는 거부)
- 잡 실패 시 `status: "FAILED"`, `errorMessage` 포함

---

## Case 6: 동기화된 이슈/PR 목록 조회 with 필터 (Validation)

### Input
- 요청 A (전체): `GET http://localhost:3000/repos/{repoId}/items`
- 요청 B (열린 항목만): `GET http://localhost:3000/repos/{repoId}/items?state=OPEN`
- 요청 C (PR만 + 페이지네이션): `GET http://localhost:3000/repos/{repoId}/items?type=PR&limit=10&offset=0`
- 헤더: `Cookie: tidyx_session=<userId>`

### Expected Output
- 모두 HTTP 200
- 응답 본문: `{ items: [...], total, limit, offset }`
- 각 item: `id`, `number`, `type` (`ISSUE`/`PR`), `state` (`OPEN`/`CLOSED`), `title`, `url`, `labels[]`, `updatedAtOnGitHub`
- 요청 B의 `items`는 모두 `state === "OPEN"`
- 요청 C의 `items.length ≤ 10`

### Acceptance Criteria
- `limit` 최대값 (예: 100) 초과 시 클램핑되거나 400 응답
- 잘못된 `type` 값 (예: `?type=FOO`)은 400 Bad Request

---

## Case 7: 저장소 연동 해제 (Validation)

### Input
- 요청: `DELETE http://localhost:3000/repos/{repoId}`
- 헤더: `Cookie: tidyx_session=<userId>`

### Expected Output
- HTTP 204 No Content
- DB에서 `ConnectedRepository` 및 관련 `WorkItem`, `SyncJob` 레코드 cascade 삭제

### Acceptance Criteria
- 다른 사용자의 저장소 해제 시도 시 404 또는 403
- 삭제 후 동일 저장소 재연동 가능

---

## Case 8: 존재하지 않는 저장소에 sync 요청 (Defect)

### Input
- 요청: `POST http://localhost:3000/repos/999999/sync`
- 헤더: `Cookie: tidyx_session=<userId>`

### Expected Output
- HTTP 404 Not Found
- 응답 본문에 명확한 에러 메시지

### Acceptance Criteria
- 내부 DB 에러 메시지 노출 금지
- 응답 시간 < 200ms (빠른 실패)

---

## Case 9: 잘못된 fullName 형식으로 연동 (Defect / Boundary)

### Input
- 요청: `POST http://localhost:3000/repos`
- 본문 (여러 케이스):
  - `{ "fullName": "" }` (빈 문자열)
  - `{ "fullName": "no-slash" }` (슬래시 없음)
  - `{ "fullName": "a/b/c" }` (슬래시 2개)
  - `{ "fullName": "owner/" }` (repo 누락)
  - `{}` (필드 누락)

### Expected Output
- 모든 케이스에서 HTTP 400 Bad Request
- `class-validator` 검증 에러 메시지 포함

### Acceptance Criteria
- DB에 잘못된 데이터가 저장되지 않음
- 한글·공백·특수문자 등의 경계 입력도 안전하게 처리

---

## Case 10: GitHub API 율 제한(rate limit) 도달 시 (Defect / Stress)

### Input
- GitHub API rate limit이 0인 상태에서 `POST /repos/{repoId}/sync` 호출
- (재현 방법: GitHub API에 대량 호출을 미리 발생시킴)

### Expected Output
- HTTP 429 Too Many Requests 또는 503
- 응답 본문에 재시도 가능 시각 안내 (`Retry-After` 또는 메시지)
- DB 상태는 변경되지 않음 (원자성)

### Acceptance Criteria
- 시스템이 panic하거나 무한 재시도하지 않음
- 사용자에게 명확한 안내 메시지 제공
