# adr-004-llm-call-pattern.md

## Title: ADR-004 분석 시 이슈당 LLM 1회 직렬 호출 + 라벨 자동 적용 보류

## Context

`/repos/:id/analyze` endpoint는 저장소의 모든 Issue/PR을 대상으로 다음을 수행해야 한다.

1. **중복 그룹** 탐지 (Jaccard 유사도, LLM 미사용)
2. **우선순위** 분류 (HIGH/MEDIUM/LOW)
3. **라벨 추천** (`bug`, `enhancement` 등)

LLM 호출 패턴 옵션:
- A. **이슈당 1회 직렬 호출** (단순, 비용 명확)
- B. **이슈 N개 묶어 1회 배치** (저비용, 응답 파싱 복잡)
- C. **병렬 호출 (Promise.all)** (빠름, rate limit 위험)

라벨 적용 옵션:
- α. **추천만 표시** (사용자가 GitHub에서 직접 적용)
- β. **자동 적용** (GitHub PATCH API 호출)

## Decision

- **LLM 호출**: 옵션 A (이슈당 1회 **직렬** 호출). [analysis.service.ts:248](../../backend/src/analysis/analysis.service.ts#L248) 구현.
- **라벨 적용**: 옵션 α (**추천만 표시, 자동 적용 안 함**). [analysis.controller.ts:85](../../backend/src/analysis/analysis.controller.ts#L85)의 endpoint 주석에 "no auto apply" 명시.

## Status

accepted (프로토타입), **성능·UX 개선 시 재검토**

## Consequence

### 긍정
- 구현 단순 — 한 이슈 실패가 다음 이슈에 영향 안 줌 (단, 현재 try/catch 미적용은 별건)
- 비용 추적 명확 — `이슈 수 = LLM 호출 수`
- 사용자 신뢰 — 의도하지 않은 라벨이 GitHub에 자동 추가되지 않음

### 부정
- **느림** — 100개 이슈 분석 시 직렬 호출로 5~10분 소요
- **비쌈** — 배치 사용 시 대비 약 3~5배 토큰 비용
- **사용자 불편** — 추천 라벨을 보고 사용자가 GitHub에 직접 클릭해서 적용해야

### 결정에 따른 추가 작업
- README의 "🏷️ 자동 라벨링" 문구를 "🏷️ 라벨 추천"으로 정정 필요
- 향후 옵션 B (배치) 또는 옵션 C (Promise.all + p-limit) 도입 검토
- 라벨 적용 endpoint (`POST /items/:id/labels`) 추가 검토 → 새 ADR 필요
- 진행률 UI는 [adr-005](./adr-005-cookie-session-vs-jwt.md)와 별개로 SyncJob 패턴을 AnalyzeJob에도 적용 권장
