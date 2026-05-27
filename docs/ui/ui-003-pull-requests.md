# ui-003-pull-requests.md

## Title: Pull Requests 목록 화면

> 진입점: 콘솔 상단 `Pull Requests` 탭
> 컴포넌트: [ConsolePage.tsx:796-840](../../frontend/src/features/console/pages/ConsolePage.tsx#L796)

## Layout

[ui-002 Issues 목록](./ui-002-issues-list.md)과 동일한 구조. 데이터만 PR로 필터.

```
┌──────────────────────────────────────────────────────────┐
│ TidyX | owner/repo ▾ | [Issues] [PR ✓] [Projects] [..]   │
│                                                          │
│  Pull Requests                       [ 검색 입력 ]       │
│                                                          │
│  [🔴 High] [🟡 Mid] [⚪ Low]                             │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │ ● #88428  Fix crash in parser           [ 2 ] │      │
│  │   AI: Critical crash fix...                    │      │
│  ├────────────────────────────────────────────────┤      │
│  │ ● #88427  Refactor auth flow            [ 0 ] │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

## Components

[ui-002](./ui-002-issues-list.md)의 모든 컴포넌트와 동일하되, 데이터 소스가 다음과 같이 다름:

| 항목 | Issues | Pull Requests |
|------|--------|---------------|
| 데이터 소스 | `prItems` (`type === 'PULL_REQUEST'`) | `issueItems` (`type === 'ISSUE'`) |
| 검색 state | `state.prSearch` | `state.issueSearch` |
| 필터 칩 state | `state.prChips` | `state.issueChips` |
| 정렬 state | `state.prSort` | `state.issueSort` |
| 페이지 ID | `page-pullrequests` | `page-issues` |

## User Story

**팀 리뷰어로서** OPEN 상태의 PR 중 우선순위 높은 것부터 리뷰하고 싶다. 그리고 어떤 PR이 중복 작업인지 빠르게 알아채고 싶다.

### 시나리오
1. 상단 `Pull Requests` 탭 클릭
2. 우선순위 HIGH PR이 자동 상단 정렬됨
3. 검색창에 "auth" 입력 → 인증 관련 PR만 노출
4. 중복 표시(⚠ Duplicate)가 붙은 PR 발견 → 클릭해서 상세 확인 → 중복인 쪽 close

### Edge Cases
- 백엔드 [WorkItem.type](../../backend/src/common/domain.constants.ts) 값은 `'ISSUE' | 'PULL_REQUEST'`
- Frontend의 [RepositoryService.fetchRepositoryData](../../frontend/src/features/repositories/services/repositoryService.ts#L46)가 type별로 분리 fetch
- 일부 PR에는 라벨이 없을 수 있음 → 빈 라벨 영역 처리

### 개선 필요 사항
- ui-002와 동일 (정렬·필터 해제 UI 등)
- 추가: PR 전용 정보(머지 가능 여부, 리뷰어, CI 상태)는 현재 표시 안 됨
