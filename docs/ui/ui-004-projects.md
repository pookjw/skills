# ui-004-projects.md

## Title: Projects 화면 (사용자 정의 프로젝트 그룹)

> 진입점: 콘솔 상단 `Projects` 탭
> 컴포넌트: [ConsolePage.tsx:1012-1045](../../frontend/src/features/console/pages/ConsolePage.tsx#L1012)

> ⚠️ **현재 상태**: 백엔드 API 없음, Frontend localStorage 전용. **추가 폼이 UI에 없어 사실상 사용 불가**.

## Layout (의도된 형태)

```
┌──────────────────────────────────────────────────────────┐
│  Projects                              [ + Add Project ] │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Auth Refactor    │  │ Mobile Support   │              │
│  │ 인증 로직 개선   │  │ 모바일 대응      │              │
│  │ [ ✓ Active ]     │  │ [ Set Active ]   │              │
│  └──────────────────┘  └──────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

## Layout (현재 실제 상태)

```
┌──────────────────────────────────────────────────────────┐
│  Projects                                                │  ← 추가 버튼 없음
│                                                          │
│  ┌──────────────────────────────────────────────┐        │
│  │ 등록된 Project가 없습니다                    │        │  ← 영구히 빈 상태
│  │ 프로젝트를 추가해보세요.                     │        │
│  └──────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

## Components

| 컴포넌트 | 역할 | 데이터 소스 |
|----------|------|-------------|
| `page-title` | "Projects" 헤더 | - |
| `project-card` (반복) | 단일 프로젝트 카드 | `selectedRepoProjects` |
| `project-card-title` | 프로젝트 이름 | `project.name` |
| `project-card-desc` | 키워드/설명 | `project.description` |
| `btn-sm btn-sm-switch` | "Set Active" / "✓ Active" 토글 | onClick → `state.setActiveProjectId(project.id)` |
| **(누락)** `btn-add` | "+ Add Project" 버튼 | **현재 없음** |
| **(누락)** 입력 폼 | 이름·설명 입력 | **현재 없음** |
| **(누락)** 삭제 버튼 | 프로젝트 제거 | **현재 없음** |

## User Story

**팀 리드로서** 하나의 저장소를 여러 작업 단위(예: "Auth Refactor", "Mobile Support")로 나누어, **각 작업과 관련 있는 이슈만 필터링**해서 보고 싶다.

### 의도된 시나리오 (현재 미구현)
1. Projects 탭 진입
2. "+ Add Project" 클릭
3. 이름: "Auth Refactor", 설명: "auth, login, session, oauth" 입력
4. 저장 → localStorage에 `tidyx:projects` 키로 저장
5. 카드의 "Set Active" 클릭 → activeProjectId 설정
6. Issues 탭 이동 → `ProjectService.calculateMatchScore`가 활성 프로젝트와 매칭되는 이슈만 표시 (score >= 0.2)

### Edge Cases
- 저장소 미선택: "Active Repository를 먼저 선택하세요" 표시
- localStorage 차단/크기 초과: 저장 안 됨, 사용자 모름
- 같은 이름으로 여러 프로젝트 생성 가능 (uniqueness 보장 안 됨)

### 개선 필요 사항 (높은 우선순위)
1. **+ Add Project 버튼 + 입력 폼 추가**
   - `state.projectNameInput`, `state.projectDescriptionInput`이 이미 useConsoleState에 정의됨
   - `ProjectService.createProject(repoId, name, description)` 호출 후 `setRepoProjects([...prev, newProject])`
2. **삭제 버튼 추가** — 카드 우측 ✕
3. **백엔드 영속화 검토** — 현재 localStorage 전용이라 브라우저별로 갈림
4. **Active 토글 동작 추가** — 같은 카드 다시 클릭 시 해제
