# test-005-duplicate-detection.md

## Title: 중복 이슈 검사

> **Tested module**: `backend/src/analysis/analysis.controller.ts` (getDuplicates), `backend/src/analysis/utils/text-similarity.ts`
> **Tested endpoint**: `GET /repos/:id/duplicates`
> **Test type**: Validation testing + Defect testing
> **Test level**: Component testing (controller ↔ service ↔ DB), Unit testing (text-similarity)

---

## Case 1: 분석 후 중복 그룹 조회 (Validation)

### Input
- 요청: `GET http://localhost:3000/repos/{repoId}/duplicates`
- 헤더: `Cookie: tidyx_session=<userId>`
- 사전 조건: test-003 Case 1 통과

### Expected Output
- HTTP 200 응답
- 응답 본문: `{ groups: [...], totalGroups: N }`
- 각 group: `{ groupId, similarity, items: [{ itemId, number, type, title, url }] }`
- `similarity`는 0.0 ~ 1.0 범위의 실수
- 각 group의 `items.length ≥ 2`

### Acceptance Criteria
- `totalGroups = groups.length`
- 동일 이슈가 여러 그룹에 중복 등장하지 않음 (또는 명시적 허용)

---

## Case 2: 명백히 중복인 이슈 쌍 탐지 (Validation)

### Input
- 사전 조건: 다음 두 이슈가 sync됨:
  - 이슈 A: `title: "Login button does not work"`, `body: "Clicking login does nothing"`
  - 이슈 B: `title: "Cannot login"`, `body: "Login button has no effect when clicked"`
- `/analyze` 실행

### Expected Output
- A와 B가 동일한 `groupId`에 속함
- 해당 그룹의 `similarity ≥ 0.7`

### Acceptance Criteria
- 의미적으로 동일한 이슈를 탐지 (어휘만 다름)
- True positive — 누락 시 실패

---

## Case 3: 명백히 다른 이슈는 그룹화하지 않음 (Validation)

### Input
- 사전 조건: 다음 두 이슈가 sync됨:
  - 이슈 C: `title: "Add dark mode"`
  - 이슈 D: `title: "Fix memory leak in image loader"`
- `/analyze` 실행

### Expected Output
- C와 D는 같은 `groupId`에 묶이지 **않음**

### Acceptance Criteria
- False positive 방지 — 무관한 이슈가 묶이면 실패
- `similarity` 임계값 (예: 0.6) 미만은 그룹화하지 않음

---

## Case 4: 중복이 없는 저장소 (Boundary)

### Input
- 사전 조건: 모든 이슈가 서로 무관한 주제. `/analyze` 실행

### Expected Output
- HTTP 200, `{ groups: [], totalGroups: 0 }`

### Acceptance Criteria
- 강제로 그룹을 생성하지 않음 (false positive 방지)

---

## Case 5: 3개 이상의 이슈가 한 그룹에 묶임 (Validation)

### Input
- 사전 조건: 3개 이상의 유사 이슈 (예: 같은 버그를 다른 사용자가 각각 보고)

### Expected Output
- 해당 이슈들이 모두 동일 `groupId`에 속함
- `items.length ≥ 3`

### Acceptance Criteria
- pairwise 비교가 아닌 transitive 클러스터링이 동작 (A~B, B~C 유사 → A,B,C 한 그룹)

---

## Case 6: 분석 미수행 상태 조회 (Boundary)

### Input
- 요청: `GET http://localhost:3000/repos/{repoId}/duplicates`
- 사전 조건: `/analyze` 미실행

### Expected Output
- HTTP 200, `{ groups: [], totalGroups: 0 }`

### Acceptance Criteria
- 404 아닌 정상 빈 응답

---

## Case 7: 이슈 본문이 비어있는 경우 (Boundary)

### Input
- 사전 조건: `title`만 있고 `body: ""` 인 이슈 여러 개

### Expected Output
- HTTP 200 응답, 분석 정상 수행
- 제목만으로 유사도 판단

### Acceptance Criteria
- 빈 본문으로 인한 NPE 또는 division by zero 없음

---

## Case 8: 한글-영어 혼용 중복 탐지 (Validation / 다국어)

### Input
- 이슈 E (한글): `title: "로그인 버튼이 동작하지 않음"`
- 이슈 F (영어): `title: "Login button does not work"`
- `/analyze` 실행

### Expected Output
- E와 F가 동일 그룹에 속하면 가산점 (LLM 기반 의미 유사도가 동작)
- 미구현 시 그룹화 안 되어도 acceptable

### Acceptance Criteria
- 시스템이 다국어 입력을 거부하거나 충돌하지 않음
- 한글 토큰화로 인한 분석 실패 없음

---

## Case 9: 동일 이슈 (number 같음) 비교 회피 (Defect)

### Input
- DB에 동일한 이슈가 (버그로 인해) 중복 저장된 상황. `/analyze` 실행

### Expected Output
- 동일 `number`를 가진 항목은 그룹의 별도 멤버로 카운트되지 않음

### Acceptance Criteria
- 자기 자신과 비교한 결과(similarity=1.0)가 노출되지 않음

---

## Case 10: 권한 없는 저장소의 중복 그룹 조회 (Defect / Security)

### Input
- 요청: `GET http://localhost:3000/repos/{otherUserRepoId}/duplicates`
- 헤더: 다른 사용자의 쿠키

### Expected Output
- HTTP 403 또는 404

### Acceptance Criteria
- 타 사용자의 중복 그룹 정보가 노출되지 않음

---

## Unit Test: text-similarity.ts (Pure function)

> 별도의 unit test로 분리하여 자동화 추천.

### Case U-1: 동일 문자열
- Input: `similarity("hello", "hello")`
- Expected: `1.0`

### Case U-2: 완전히 다른 문자열
- Input: `similarity("apple", "xyz")`
- Expected: `< 0.3`

### Case U-3: 빈 문자열
- Input: `similarity("", "")`, `similarity("foo", "")`
- Expected: 명확히 정의된 값 (예: `0.0` 또는 `1.0`), throw 없음

### Case U-4: 대소문자 무시
- Input: `similarity("Login", "login")`
- Expected: `1.0` 또는 매우 높음

### Case U-5: 매우 긴 문자열 (Performance)
- Input: 10,000자 문자열 두 개
- Expected: 1초 이내 결과 반환
