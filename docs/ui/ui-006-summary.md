# ui-006-summary.md

## Title: Summary 대시보드 화면

> 진입점: 콘솔 상단 `Summary` 탭
> 컴포넌트: [ConsolePage.tsx:884-931](../../frontend/src/features/console/pages/ConsolePage.tsx#L884)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Summary                              owner/repo         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 전체 Issues  │  │ 전체 PR      │                     │
│  │     42       │  │     17       │                     │
│  │ Open Issues  │  │ Open PR      │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Priority 분포                                    │   │
│  │ 🔴 High   ███████░░░░░░░░░░░░░░░░░  12          │   │
│  │ 🟡 Mid    ██████████████░░░░░░░░░░  24          │   │
│  │ ⚪ Low    █████████░░░░░░░░░░░░░░░  17          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Components

| 컴포넌트 | 역할 | 데이터 소스 |
|----------|------|-------------|
| `summary-card` (Issues) | OPEN 이슈 수 | `issueItems.length` |
| `summary-card` (PRs) | OPEN PR 수 | `prItems.length` |
| `summary-card` (Priority 분포) | 우선순위별 바 차트 | `priorityCounts` |
| `bar-row` (반복 3) | HIGH/MEDIUM/LOW 행 | 색상: 빨강/노랑/회색 |
| `bar-fill` | 막대 길이 (max 기준 비율) | `(count / maxPriority) * 100` |
| `bar-val` | 우측 숫자 | `count` |

## User Story

**메인테이너로서** 저장소의 현재 상태를 **30초 안에 파악**하고 싶다. 우선순위 분포가 한쪽으로 치우쳐 있는지, OPEN 작업이 너무 많지 않은지 등.

### 시나리오
1. 분석 완료 후 Summary 탭 진입
2. 카드 3개로 전체 상태 즉시 파악
3. HIGH 우선순위가 비정상적으로 많으면 Issues 탭으로 이동해 정리

### Edge Cases
- 저장소 미선택: "Repository 미선택" 표시
- 분석 미수행: 모든 카운트가 0 또는 UNASSIGNED만 표시됨
- 모든 카운트가 0: bar-fill 너비 0% (`maxPriority = 1`로 0/0 회피)

### 개선 필요 사항
- **카드 제목과 부제목 불일치** — "전체 Issues" / "Open Issues" 헷갈림. 통일 필요
- 추가하면 좋을 카드:
  - 중복 그룹 수 (`state.duplicates.length`)
  - 마지막 분석 시각 (`state.analysisSummary?.analyzedAt`)
  - 가장 오래된 OPEN 이슈
  - 라벨별 미니 도넛 차트
- "UNASSIGNED" 항목이 분포에서 빠짐 (의도된 동작인지 확인 필요)
