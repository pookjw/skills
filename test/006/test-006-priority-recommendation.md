# test-006-priority-recommendation.md

## Title: 이슈 우선순위 추천

> **Tested module**: `backend/src/analysis/analysis.controller.ts` (getPriorities)
> **Tested endpoint**: `GET /repos/:id/priorities`
> **Test type**: Validation testing + Defect testing
> **Test level**: Component testing (controller ↔ service ↔ DB)

> **Note**: 우선순위 결과는 test-003의 `/analyze` 실행 시 생성됨. 이 문서는 조회 endpoint와 결과 품질을 검증한다.

---

## Case 1: 분석 후 우선순위 결과 조회 (Validation)

### Input
- 요청: `GET http://localhost:3000/repos/{repoId}/priorities`
- 헤더: `Cookie: tidyx_session=<userId>`
- 사전 조건: test-003 Case 1 통과

### Expected Output
- HTTP 200 응답
- 응답 본문: `{ items: [...], total: N }`
- 각 item: `{ itemId, number, type, priority, reason, title }`
- `priority`는 정의된 enum 값 (예: `HIGH`, `MEDIUM`, `LOW`) 중 하나
- `reason`은 비어있지 않은 문자열

### Acceptance Criteria
- `total = items.length`
- 우선순위가 결정되지 않은 이슈는 응답에서 제외하거나 `priority: "UNKNOWN"`으로 표시

---

## Case 2: 중대 버그(HIGH) 분류 정확도 (Validation)

### Input
- 사전 조건: 다음 이슈가 sync + analyze됨
  - `title: "Production database is down"`
  - `body: "All users are unable to log in. Critical outage."`
  - `labels: ["bug", "critical"]`

### Expected Output
- 해당 이슈의 `priority: "HIGH"`
- `reason`에 "outage" / "critical" / "production" 관련 키워드 포함

### Acceptance Criteria
- "critical", "blocker", "production down", "data loss" 등의 키워드가 있는 이슈는 HIGH로 분류
- 샘플 10건 중 9건 이상 정확 (90%)

---

## Case 3: 사소한 개선(LOW) 분류 정확도 (Validation)

### Input
- 사전 조건:
  - `title: "Update copyright year in footer"`
  - `body: "Should be 2025, not 2024"`

### Expected Output
- 해당 이슈의 `priority: "LOW"`
- `reason`에 "minor" / "trivial" / "cosmetic" 등의 표현 포함

### Acceptance Criteria
- UI 텍스트, 오타, 작은 cosmetic 변경은 LOW로 분류

---

## Case 4: 중간 우선순위(MEDIUM) 분류 (Validation)

### Input
- 사전 조건:
  - `title: "Improve search performance"`
  - `body: "Search takes 3 seconds, would be nice to make faster"`

### Expected Output
- 해당 이슈의 `priority: "MEDIUM"`

### Acceptance Criteria
- 사용자 경험 개선, 성능 최적화 등은 MEDIUM으로 분류
- HIGH로 과도 분류되지 않음

---

## Case 5: 이슈 본문이 모호한 경우 (Boundary)

### Input
- 사전 조건:
  - `title: "도와주세요"`
  - `body: ""`

### Expected Output
- HTTP 200, 해당 이슈의 `priority`가 결정됨 (기본값 또는 `MEDIUM`/`UNKNOWN`)
- `reason`에 "정보 부족" 또는 유사한 사유

### Acceptance Criteria
- 분석 자체가 실패하지 않음
- 모호한 이슈가 일관되게 HIGH로 분류되지 않음 (false positive 방지)

---

## Case 6: 분석 미수행 상태 조회 (Boundary)

### Input
- 요청: `GET http://localhost:3000/repos/{repoId}/priorities`
- 사전 조건: `/analyze` 미실행

### Expected Output
- HTTP 200, `{ items: [], total: 0 }`

### Acceptance Criteria
- 404 아닌 정상 빈 응답
- 응답 시간 < 200ms

---

## Case 7: 우선순위 분포 합리성 (Validation / Statistical)

### Input
- 사전 조건: 무작위 이슈 100개 분석

### Expected Output
- HIGH: 5~20%, MEDIUM: 40~70%, LOW: 20~50% 분포
- 한 카테고리에 100% 몰리지 않음

### Acceptance Criteria
- LLM이 모든 이슈를 같은 등급으로 분류하면 실패
- 분포가 극단적이지 않아야 운영상 유용

---

## Case 8: 동일 이슈 재분석 시 결과 일관성 (Validation / Determinism)

### Input
- 동일 이슈에 대해 `/analyze` 두 번 실행 후 두 번째 결과 조회

### Expected Output
- 두 번의 `priority` 결과가 80% 이상 일치

### Acceptance Criteria
- LLM의 비결정성으로 인해 100%는 어렵지만, 매번 다른 결과면 실패
- `temperature=0` 설정 등으로 결정성 확보 필요

---

## Case 9: 한글 이슈 우선순위 분류 (Validation)

### Input
- 사전 조건:
  - `title: "결제 화면이 멈춥니다"`
  - `body: "결제 버튼을 누르면 화면이 멈추고 결제가 안 됩니다"`

### Expected Output
- 해당 이슈의 `priority: "HIGH"` (결제 차단 = 비즈니스 영향 큼)
- `reason`이 한글 또는 영어로 명확히 작성됨

### Acceptance Criteria
- 한글 이슈에 대해서도 영어 이슈와 동등한 분류 품질

---

## Case 10: 권한 없는 저장소의 우선순위 조회 (Defect / Security)

### Input
- 요청: `GET http://localhost:3000/repos/{otherUserRepoId}/priorities`
- 헤더: 다른 사용자의 쿠키

### Expected Output
- HTTP 403 또는 404

### Acceptance Criteria
- 타 사용자의 이슈 우선순위 정보가 노출되지 않음

---

## Case 11: `priority` enum 외 값이 반환되는 경우 (Defect)

### Input
- LLM이 비정형 응답을 반환한 경우 (예: `"매우 높음"`, `"P1"`)

### Expected Output
- 시스템이 enum 값으로 변환하거나 기본값 처리
- 응답 본문에 항상 정의된 enum 값만 포함

### Acceptance Criteria
- 비정형 응답이 그대로 API 응답에 노출되지 않음
- 변환 실패 시 명확한 fallback 동작
