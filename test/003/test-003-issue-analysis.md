# test-003-issue-analysis.md

## Title: AI 기반 이슈 분석 실행 (중복 + 우선순위 + 라벨 통합)

> **Tested module**: `backend/src/analysis/analysis.controller.ts`, `backend/src/analysis/analysis.service.ts`, `backend/src/analysis/utils/text-similarity.ts`
> **Tested endpoint**: `POST /repos/:id/analyze`
> **Test type**: Validation testing + Defect testing
> **Test level**: System testing (controller ↔ service ↔ DB ↔ OpenAI API)

---

## Case 1: 동기화된 저장소에 대한 분석 실행 (Validation)

### Input
- 요청: `POST http://localhost:3000/repos/{repoId}/analyze`
- 헤더: `Cookie: tidyx_session=<userId>`
- 사전 조건:
  - test-002 Case 4 또는 5가 통과해 `WorkItem` 테이블에 5개 이상의 이슈가 저장됨
  - `.env`의 `OPENAI_API_KEY`가 유효함

### Expected Output
- HTTP 200 응답
- 응답 본문: `{ repositoryId, analyzedItems, duplicateGroups, llmUsed: true, analyzedAt }`
- `analyzedItems` = DB의 `WorkItem` 개수
- `duplicateGroups ≥ 0`
- DB에 분석 결과 저장:
  - `DuplicateGroup` 및 `DuplicateGroupItem`
  - `WorkItem.priority`, `WorkItem.priorityReason`
  - `LabelRecommendation` 레코드들

### Acceptance Criteria
- 응답 시간 < 60초 (이슈 100개 기준)
- OpenAI 호출 횟수가 합리적 (이슈당 1~2회 이하)
- 같은 이슈에 대해 재분석 시 기존 결과 덮어쓰기 (멱등)

---

## Case 2: 분석 대상 이슈가 0개인 저장소 (Boundary)

### Input
- 요청: `POST http://localhost:3000/repos/{repoId}/analyze`
- 사전 조건: 저장소는 연동되었으나 sync 미실행 또는 sync 결과 0건

### Expected Output
- HTTP 200 응답
- 응답 본문: `analyzedItems: 0`, `duplicateGroups: 0`, `llmUsed: false`
- OpenAI API 호출되지 않음 (불필요한 비용 방지)

### Acceptance Criteria
- 빈 입력에 대해 에러 없이 정상 종료
- 응답 시간 < 1초

---

## Case 3: 분석 대상 이슈가 1개인 저장소 (Boundary)

### Input
- 사전 조건: `WorkItem` 1개만 존재
- 요청: `POST http://localhost:3000/repos/{repoId}/analyze`

### Expected Output
- HTTP 200 응답
- `analyzedItems: 1`, `duplicateGroups: 0` (비교 대상 없음)
- 해당 이슈의 `priority` 및 `LabelRecommendation`은 생성됨

### Acceptance Criteria
- 단일 항목에 대한 우선순위/라벨 분석은 정상 수행
- 중복 검사는 자기 자신과 비교하지 않음

---

## Case 4: 대량 이슈 분석 (Stress / Performance)

### Input
- 사전 조건: `WorkItem` 500개 존재
- 요청: `POST http://localhost:3000/repos/{repoId}/analyze`

### Expected Output
- HTTP 200 응답 (타임아웃 없이 완료)
- `analyzedItems: 500`
- 메모리 사용량이 일정 임계치 이하 유지

### Acceptance Criteria
- 응답 시간 < 10분
- OpenAI 토큰 사용량이 예상 한도 이하
- 일부 이슈 분석 실패 시에도 전체 트랜잭션이 롤백되지 않고 부분 결과 저장

---

## Case 5: OpenAI API 키 누락/무효 (Defect)

### Input
- 사전 조건: `.env`의 `OPENAI_API_KEY`가 비어있거나 잘못됨
- 요청: `POST http://localhost:3000/repos/{repoId}/analyze`

### Expected Output
- HTTP 500 또는 503 응답
- 응답 본문에 사용자 친화적 에러 메시지 (예: `"AI 분석 서비스에 연결할 수 없습니다"`)
- OpenAI 원본 에러 메시지(API key invalid 등)는 노출되지 않음

### Acceptance Criteria
- 시스템이 중복 검사(LLM 불필요 부분)는 여전히 수행하도록 graceful degradation 가능 (선택)
- 에러 로그에는 상세 원인 기록

---

## Case 6: 존재하지 않는 모델 지정 (Defect)

### Input
- 사전 조건: `.env`의 `OPENAI_MODEL=gpt-5.4-mini` (실재하지 않는 모델)
- 요청: `POST http://localhost:3000/repos/{repoId}/analyze`

### Expected Output
- HTTP 500 또는 503 응답
- 응답 본문에 "모델 설정 오류" 안내

### Acceptance Criteria
- 동일한 요청을 반복 호출해도 동일하게 실패 (재시도로 우회되지 않음)
- 로그에 사용된 모델명이 기록되어 운영자가 진단 가능

---

## Case 7: 권한 없는 저장소에 분석 요청 (Defect / Security)

### Input
- 요청: `POST http://localhost:3000/repos/{otherUserRepoId}/analyze`
- 헤더: `Cookie: tidyx_session=<userId>` (다른 사용자의 쿠키)

### Expected Output
- HTTP 403 Forbidden 또는 404 Not Found

### Acceptance Criteria
- 다른 사용자의 저장소 데이터가 응답에 노출되지 않음
- DB 상태 변경 없음

---

## Case 8: 분석 진행 중 중복 호출 (Concurrency)

### Input
- 요청 A: `POST /repos/{repoId}/analyze` (실행 중)
- 요청 B: 요청 A 종료 전 동일 endpoint 재호출

### Expected Output
- 요청 B가 중복 분석을 회피하거나 (HTTP 409) 큐잉됨
- DB의 분석 결과에 중복 레코드 없음

### Acceptance Criteria
- Race condition으로 인한 데이터 일관성 깨짐 없음
- OpenAI 비용이 2배 발생하지 않음
