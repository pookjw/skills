# ui-005-labels.md

## Title: Labels 통계 화면

> 진입점: 콘솔 상단 `Labels` 탭
> 컴포넌트: [ConsolePage.tsx:842-882](../../frontend/src/features/console/pages/ConsolePage.tsx#L842)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Labels                                                  │
│                                                          │
│  ▣  bug                  observed 12 · recommended 8    │
│  ▣  enhancement          observed 7  · recommended 5    │
│  ▣  documentation        observed 4  · recommended 3    │
│  ▣  priority/high        observed 0  · recommended 9    │
│  ▣  question             observed 2  · recommended 0    │
└──────────────────────────────────────────────────────────┘
```

## Components

| 컴포넌트 | 역할 | 데이터 소스 |
|----------|------|-------------|
| `label-row` (반복) | 한 라벨의 통계 행 | `labelStats` (메모이즈된 집계값) |
| `label-swatch` | 색 사각형 (라벨 종류별) | `normalizeSysLabel(stat.label)` 결과로 결정 (5색) |
| `label-name-btn` | 라벨 이름 클릭 시 필터링 | onClick → `state.setLabelFilter(stat.label)` |
| `label-desc` | `observed N · recommended M` 통계 | `stat.observed`, `stat.recommended` |

## 데이터 집계 로직

[ConsolePage.tsx:380-405](../../frontend/src/features/console/pages/ConsolePage.tsx#L380)

```
labelStats = Map<labelKey, { label, observed, recommended }>
  for each item in projectScopedItems:
    for each label in item.labels:        observed++
    for each rec in item.recommendedLabels: recommended++

정렬: (observed + recommended) 내림차순, 동률 시 알파벳순
```

- **observed**: GitHub에 이미 붙어있는 라벨
- **recommended**: AI가 추천한 라벨

## User Story

**메인테이너로서** 어떤 라벨이 실제로 많이 사용되는지, AI가 어떤 라벨을 자주 추천하는지 비교하여, **라벨 정책**을 개선하고 싶다.

### 시나리오
1. 분석(`/analyze`) 완료 후 Labels 탭 진입
2. `observed=0, recommended=9`인 라벨 발견 → "AI는 추천하지만 아직 안 쓰이는 라벨"
3. 라벨 클릭 → Issues 탭에서 그 라벨이 추천된 이슈들만 보임
4. 각 이슈 검토 후 GitHub에서 실제 라벨 적용

### Edge Cases
- 분석 미수행: `labelStats`가 빈 배열 → "label 데이터가 없습니다."
- `normalizeSysLabel`이 인식하지 못하는 커스텀 라벨: 노란색(`#9a6700`)으로 표시
- 동일 라벨이 대소문자 다르게 표기: 키가 소문자 정규화되어 한 행으로 집계

### 개선 필요 사항
- **라벨 클릭 시 자동으로 Issues 탭 이동** (현재는 필터만 설정되고 탭 변경 안 됨)
- 라벨 필터 활성 상태가 어디서 해제되는지 화면에 표시 (UI-002 개선과 연동)
- 색상 다양화 (현재 4-5종 고정 → 라벨 hash 기반 동적 색상)
- 각 라벨별 차이값(`recommended - observed`) 시각화 (AI 의견 vs 현실 격차)
