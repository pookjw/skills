# ui-007-repository.md

## Title: Repository 관리 화면

> 진입점: 콘솔 상단 `Repository 선택` 버튼 또는 우상단 드롭다운 → `Repository 관리`
> 컴포넌트: [ConsolePage.tsx:933-1010](../../frontend/src/features/console/pages/ConsolePage.tsx#L933)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Repository                                              │
│                                                          │
│  Connected Repositories                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ facebook/react                                     │  │
│  │ 🌐 Public · Last synced: 2분 전                   │  │
│  │              [ ✓ Selected ]  [ Disconnect ]        │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ octocat/Hello-World                                │  │
│  │ 🔒 Private · Last synced: 1시간 전                 │  │
│  │              [ Select ]      [ Disconnect ]        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [ Sync Issues/PRs ]  [ 📊 Analyze ]                    │  ← 선택된 저장소만
│                                                          │
│  Add Repository                                          │
│  [ + Add Repository ]                                    │
│   (클릭 시) [ owner/repo or URL ]  [Connect] [Cancel]   │
└──────────────────────────────────────────────────────────┘
```

## Components

| 컴포넌트 | 역할 | 데이터 소스 / 액션 |
|----------|------|---------------------|
| `repo-list` | 연결된 저장소 카드 목록 | `state.connectedRepos` |
| `repo-item` (반복) | 단일 저장소 카드 | - |
| `repo-name` | "owner/repo" | `repo.fullName` |
| `repo-meta` | private 여부 + 마지막 sync 시각 | `repo.isPrivate`, `formatRelativeTime(repo.lastSyncedAt)` |
| `btn-repo` (Select) | 활성 저장소 변경 | onClick → `state.setSelectedRepoId(repo.id)` |
| `btn-sm-danger` (Disconnect) | 저장소 해제 | onClick → `disconnectRepo(repo.id)` ⚠️ 확인 모달 없음 |
| `btn-add` (Sync) | 비동기 동기화 시작 | onClick → `startRepositorySync(selectedRepoId)` |
| `btn-add` (Analyze) | 분석 실행 | onClick → `analyzeRepo(selectedRepoId)` |
| `btn-add` (+ Add) | 입력 폼 토글 | onClick → `setShowAddRepoForm(true)` |
| `form-input` | "owner/repo" 입력 | `state.connectFullName` |
| `btn-primary` (Connect) | 저장소 연결 | onClick → `connectRepo(connectFullName)` → 연결 + 자동 sync |

## User Story

**사용자로서** 새 GitHub 저장소를 TidyX에 등록하고, 기존 저장소들을 관리(선택/동기화/분석/해제)하고 싶다.

### 시나리오 (신규 저장소 등록)
1. Repository 탭 진입
2. "+ Add Repository" 클릭 → 폼 표시
3. `octocat/Hello-World` 입력 → Connect
4. 백엔드가 GitHub API로 저장소 정보 가져와 `ConnectedRepository` 생성
5. 자동으로 sync 잡 시작 → 진행률 바 표시
6. sync 완료 시 알림 "sync 완료: fetched=42, open=10, closed=32"
7. Issues 탭으로 이동해 결과 확인 가능

### 시나리오 (분석 실행)
1. 저장소 카드의 "Select" 클릭 → 활성화
2. 하단의 "📊 Analyze" 버튼 활성화됨
3. 클릭 → 백엔드 LLM 호출 (수 분 소요)
4. 완료 시 알림 "분석 완료: 42 items, 3 groups"
5. Issues/Labels/Summary 탭에서 결과 확인

### Edge Cases
- GitHub URL 입력 시 (`https://github.com/...`): 백엔드가 그대로 GitHub API에 전달 → 404
- 이미 연결된 저장소 재연결: upsert로 갱신 (중복 안 됨)
- Disconnect 즉시 cascade 삭제 — sync/analysis 데이터 모두 사라짐
- Sync 진행 중 다른 저장소로 Select: polling 중단

### 개선 필요 사항
1. **Disconnect 확인 모달** — 데이터 손실 위험 (현재 1클릭 삭제)
2. **입력 placeholder 정확하게 변경** — "owner/repo or GitHub URL" → "owner/repo (예: facebook/react)"
3. **GitHub URL 자동 변환** — `https://github.com/owner/repo` → `owner/repo`
4. **연결된 저장소 0개일 때 안내 메시지**
5. **Sync/Analyze 버튼을 각 카드 안에 통합** (선택 → 버튼 노출 흐름이 어색)
