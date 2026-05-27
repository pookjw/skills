# test-004-label-recommendation.md

## Title: 자동 라벨 추천

> **Tested module**: `backend/src/analysis/analysis.controller.ts` (getLabelRecommendations)
> **Tested endpoint**: `GET /repos/:id/label-recommendations`
> **Test type**: Validation testing + Defect testing
> **Test level**: Component testing (controller ↔ service ↔ DB)

> **Note**: 라벨 추천 결과는 test-003의 `POST /analyze` 실행 시 생성됨. 이 문서는 조회 endpoint를 검증한다.

---

## Case 1: 분석 후 라벨 추천 결과 조회 (Validation)

### Input
- 요청: `GET http://localhost:3000/repos/{repoId}/label-recommendations`
- 헤더: `Cookie: tidyx_session=<userId>`
- 사전 조건: test-003 Case 1이 통과되어 분석 결과가 DB에 존재함

### Expected Output
- HTTP 200 응답
- 응답 본문: `{ items: [...], total: N }`
- 각 `item`은 이슈 ID, 추천 라벨 배열, 추천 이유, 신뢰도(있다면)를 포함
- `total = items.length`

### Acceptance Criteria
- 각 이슈에 최소 1개 이상의 라벨이 추천됨 (분석 완료된 이슈 한정)
- 추천 라벨은 GitHub 표준 라벨 어휘(`bug`, `enhancement`, `documentation` 등) 또는 저장소의 기존 라벨과 호환

---

## Case 2: 분석 미수행 상태에서 조회 (Boundary)

### Input
- 요청: `GET http://localhost:3000/repos/{repoId}/label-recommendations`
- 사전 조건: 저장소는 연동 + sync되었으나 `/analyze` 미실행

### Expected Output
- HTTP 200 응답
- 응답 본문: `{ items: [], total: 0 }`

### Acceptance Criteria
- 빈 결과를 정상 응답으로 처리 (404 아님)
- 응답 시간 < 200ms

---

## Case 3: 일반 이슈(bug) 키워드 추천 정확도 (Validation)

### Input
- 사전 조건: 다음 본문을 가진 이슈가 sync됨:
  - `title: "App crashes on startup"`
  - `body: "When I open the app, it immediately crashes. Steps to reproduce: 1) ..."`
- `/analyze` 실행 후 조회

### Expected Output
- 해당 이슈의 추천 라벨에 `bug` 포함

### Acceptance Criteria
- 명확히 "crash", "error", "broken" 등의 단어를 포함한 이슈는 `bug` 라벨이 누락되면 실패
- 라벨 추천 정확도 측정: 샘플 10개 중 8개 이상 적절한 라벨이어야 함 (80%)

---

## Case 4: 기능 제안(enhancement) 키워드 추천 정확도 (Validation)

### Input
- 사전 조건: 다음 본문을 가진 이슈:
  - `title: "Add dark mode support"`
  - `body: "It would be nice if we could switch to dark mode..."`

### Expected Output
- 추천 라벨에 `enhancement` 또는 `feature` 포함

### Acceptance Criteria
- "add", "would be nice", "feature request" 등 표현이 있는 이슈는 `enhancement` 계열로 분류

---

## Case 5: 질문(question) 키워드 추천 정확도 (Validation)

### Input
- 사전 조건: 다음 본문을 가진 이슈:
  - `title: "How do I configure X?"`
  - `body: "I'm trying to set up X but I can't find docs..."`

### Expected Output
- 추천 라벨에 `question` 또는 `documentation` 포함

### Acceptance Criteria
- 의문문 형태(`How`, `Why`, `Can I` 등)는 `question` 계열로 분류

---

## Case 6: 빈 본문/제목만 있는 이슈 (Boundary)

### Input
- 사전 조건: `title: "asdf"`, `body: ""` 인 이슈 sync 후 분석

### Expected Output
- HTTP 200 응답
- 해당 이슈의 추천 라벨이 존재 (예: `needs-triage`, `unclear`) 또는 빈 배열 + 사유 포함

### Acceptance Criteria
- 분석 자체가 실패하지 않음
- 사용자가 "추천 불가"임을 인지할 수 있는 정보 제공

---

## Case 7: 한글 이슈에 대한 라벨 추천 (Validation)

### Input
- 사전 조건:
  - `title: "앱 실행 시 즉시 종료됨"`
  - `body: "로그인 화면도 뜨지 않고 바로 꺼집니다"`

### Expected Output
- 추천 라벨에 `bug` 포함

### Acceptance Criteria
- 한글 본문에서도 영어 라벨이 정상 추천됨 (다국어 지원)

---

## Case 8: 매우 긴 본문 (Boundary / Performance)

### Input
- 사전 조건: `body.length > 10000` 인 이슈

### Expected Output
- HTTP 200 응답, 라벨 추천 정상 생성
- OpenAI 토큰 한도 초과로 인한 에러 없음 (입력 사전 truncation 필요)

### Acceptance Criteria
- 토큰 한도 초과 시 본문 앞부분만 사용하거나 요약 후 분석
- 분석 결과의 품질이 크게 저하되지 않음

---

## Case 9: 권한 없는 저장소의 추천 조회 (Defect / Security)

### Input
- 요청: `GET http://localhost:3000/repos/{otherUserRepoId}/label-recommendations`
- 헤더: 다른 사용자의 쿠키

### Expected Output
- HTTP 403 또는 404 응답

### Acceptance Criteria
- 다른 사용자의 라벨 추천 결과가 노출되지 않음
