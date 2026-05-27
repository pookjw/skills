# ui-008-item-detail.md

## Title: 이슈/PR 상세 화면

> 진입점: Issues 또는 Pull Requests 목록에서 항목 카드 클릭
> 컴포넌트: [ConsolePage.tsx:538-657](../../frontend/src/features/console/pages/ConsolePage.tsx#L538) (detailItemId가 있을 때 분기)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│ TidyX |  ← 목록으로 돌아가기                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ● Login button does not work                            │
│                                                          │
│  ● OPEN  #234  by owner  2시간 전   [bug] [priority]    │
│                                                          │
│  (duplicate일 경우)                                      │
│  ⚠ 이 항목은 duplicate group #5로 분류되었습니다.       │
│                          [ 이 항목 Close ]               │
│                                                          │
│  ┌──────────────────────────────────┐ ┌──────────────┐   │
│  │                                  │ │ Labels       │   │
│  │  (priorityReason 표시)           │ │ [bug]        │   │
│  │  AI가 우선순위 매긴 이유 텍스트  │ │              │   │
│  │  실제 issue body는 표시 안 됨    │ │ AI 추천:     │   │
│  │                                  │ │ [bug]        │   │
│  │                                  │ │ [priority/h] │   │
│  │                                  │ │              │   │
│  │                                  │ │ Project: -   │   │
│  │                                  │ │ Priority: ●H │   │
│  │                                  │ │              │   │
│  │                                  │ │ GitHub에서 →│   │
│  └──────────────────────────────────┘ └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Components

| 컴포넌트 | 역할 | 데이터 소스 |
|----------|------|-------------|
| `detail-topnav` | TidyX 로고 + "목록으로 돌아가기" 버튼 | onClick → `state.setDetailItemId(null)` |
| `detail-title` | 이슈 제목 | `detailItem.title` |
| `priority-dot` | 좌측 색 점 | `bucket = toBucketPriority(detailItem.priority)` |
| `status-badge` | OPEN / CLOSED | `detailItem.state` |
| `meta: #N by <author>` | 번호 + 작성자 | ⚠️ 현재 `author = selectedRepo.owner` (잘못됨) |
| `label-tag` (반복) | 라벨 표시 (또는 needs-triage) | `detailItem.labels` |
| `dup-banner` | 중복 그룹 안내 + Close 버튼 | `detailItem.duplicateMeta` 존재 시만 |
| `btn-close-iss` | "이 항목 Close" | onClick → `closeItem(detailItem.id)` ⚠️ duplicate일 때만 노출 |
| `detail-body-text` | **본문 영역** | ⚠️ 현재 `priorityReason` 표시 (실제 issue body 아님) |
| `ds-section: Labels` | 사이드바 — 관찰된 라벨 | `observedLabels` |
| `ds-section: AI 추천 Labels` | 사이드바 — 추천 라벨 | `recommendedLabels` |
| `ds-section: Project` | 활성 프로젝트 이름 | `activeProject?.name` |
| `ds-section: Priority` | 우선순위 텍스트 + 점 | `detailItem.priority` |
| `btn-github-link` | "GitHub에서 보기 ↗" | href={detailItem.url} target=_blank |

## User Story

**개발자로서** 목록에서 이슈를 클릭하면, **이슈의 전체 내용과 AI 분석 결과**를 한 화면에서 확인하고, 필요하면 즉시 **Close**까지 처리하고 싶다.

### 시나리오
1. Issues 목록에서 카드 클릭
2. 상세 화면 진입
3. 좌측: 이슈 본문 확인 (현재는 AI 분석 사유만 보임)
4. 우측 사이드바: 라벨, AI 추천 라벨, 우선순위, 프로젝트 확인
5. 중복 그룹이면 dup-banner의 Close 버튼으로 즉시 닫기
6. "GitHub에서 보기" → 새 탭으로 원본 이슈 페이지

### Edge Cases
- 분석 안 된 이슈: priorityReason 빈 문자열, 라벨 추천 없음
- 라벨이 없는 이슈: "needs-triage" 표시
- duplicateMeta가 없는 일반 이슈: Close 버튼이 화면에 없음 → GitHub 가서 직접 닫아야

### 개선 필요 사항 (높은 우선순위)
1. **🔴 실제 issue body 표시** — 현재 priorityReason만 보임. 백엔드 DTO에 `body` 추가 + 프론트 표시
2. **🟠 일반 이슈에도 Close 버튼** — `state === 'OPEN'`이면 항상 노출
3. **본문 마크다운 렌더링** — react-markdown 등 도입
4. **작성자(author) 정확하게 표시** — `WorkItem.authorLogin` 활용 ([repositories.controller.ts](../../backend/src/repositories/repositories.controller.ts) DTO 보강 필요)
5. **추천 라벨 클릭 → GitHub에 즉시 적용** — 신규 백엔드 endpoint 필요
6. **본문 영역에 두 섹션 분리** — "본문" / "🤖 AI 우선순위 분석"
