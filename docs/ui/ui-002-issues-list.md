# ui-002-issues-list.md

## Title: Issues 목록 화면

> 진입점: 콘솔 상단 `Issues` 탭 (기본 페이지)
> 컴포넌트: [ConsolePage.tsx:750-794](../../frontend/src/features/console/pages/ConsolePage.tsx#L750)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│ TidyX | owner/repo ▾ | [Issues] [PR] [Projects] [Labels] │  ← topnav
│                                                          │
│ ┌──── 알림/에러 영역 (있을 때만) ──────────────────────┐ │
│                                                          │
│  Issues                                  [ 검색 입력 ]   │
│                                                          │
│  [🔴 High] [🟡 Mid] [⚪ Low]                             │  ← 필터 칩
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ ● #234  Login button does not work       [ 3 ]  │    │  ← 이슈 카드
│  │   AI: Critical user-facing bug...                │    │
│  │   2h ago  [bug]                                  │    │
│  ├──────────────────────────────────────────────────┤    │
│  │ ● #233  Add dark mode support            [ 1 ]  │    │
│  │   AI: Enhancement request...                     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  (sync job 진행 중일 때) [ Progress Bar ]                │
└──────────────────────────────────────────────────────────┘
```

## Components

| 컴포넌트 | 역할 | 데이터 소스 |
|----------|------|-------------|
| `topnav` | 저장소 선택, 페이지 탭 | `state.selectedRepoId`, `state.currentPage` |
| `search-input` | 이슈 제목·본문·라벨 클라이언트 검색 | `state.issueSearch` |
| `filter-chips` | 우선순위 필터 (High/Mid/Low 토글) | `state.issueChips` |
| `issue-item` (반복) | 단일 이슈 카드 (클릭 시 상세) | `filteredIssues` (Dashboard items) |
| `priority-dot` | 좌측 색 점 (HIGH=빨강 / MEDIUM=노랑 / LOW=회색) | `item.priority` |
| `issue-number` | `#234` | `item.number` |
| `issue-title` | 이슈 제목 | `item.title` |
| `issue-summary` | AI가 생성한 우선순위 사유 (180자 절단) | `item.priorityReason` |
| `issue-meta-row` | 상대시간 + 시스템 라벨 | `formatRelativeTime(item.updatedAtOnGitHub)`, `normalizeSysLabel(label)` |
| `issue-conv-badge` | 추천 라벨 수 + 중복 형제 수 | 계산값 |
| `badge-dup-sm` (옵션) | "⚠ Duplicate" 뱃지 | `item.duplicateMeta` 존재 시 |
| `sync-progress-wrap` | 진행률 바 (sync job 실행 중) | `state.syncJob` |

## User Story

**프로젝트 관리자로서** 저장소를 선택했을 때, **AI가 우선순위를 매긴 이슈 목록**을 한눈에 보고, **검색·필터로 빠르게** 관심 이슈에 도달하고 싶다.

### 시나리오
1. 로그인 후 자동으로 Issues 탭 진입
2. 좌측 상단 `Repository 선택`에서 저장소 선택 (또는 자동 선택)
3. 저장소 데이터가 자동 로드됨 (이슈 + 우선순위 + 중복 + 라벨 추천)
4. `🔴 High` 칩만 활성화하여 위급 이슈만 표시
5. 검색창에 "login" 입력 → 제목·본문에 매칭되는 이슈만 노출
6. 관심 이슈 클릭 → 상세 화면([ui-008](./ui-008-item-detail.md))으로 이동

### Edge Cases
- 저장소 미선택: "Repository를 먼저 선택하세요" 메시지
- Sync 진행 중: "GitHub issues를 가져오는 중입니다"
- Sync 실패: 빨간색 에러 메시지 (`syncFailedMessage`)
- Sync 한 번도 안 함: "아직 sync된 데이터가 없습니다. ..."
- 필터 조건에 매칭 이슈 0건: "No issues found"

### 개선 필요 사항
- 정렬 드롭다운 노출 (현재 우선순위 내림차순 고정)
- 라벨 필터 활성 상태 표시 + 해제 버튼
- High/Mid/Low 칩이 기본 모두 활성 — 직관 반대
- `issue-conv-badge` 의미 모호 (코멘트인지 라벨인지 불명)
