# Harness Engineering 산출물 인덱스

> 강의 `11_software+harness_engineering.pdf` 양식에 따라 작성된 TidyX의 표준 산출물 모음.

## 📋 7가지 표준 산출물

| 종류 | 위치 | 양식 | 현재 |
|------|------|------|------|
| 1. **AGENTS.md** | `AGENTS.md` (root) | Project Overview / Environment / Project Structure / Code Conventions / Constraints | ✅ |
| 2. **ADR** | `docs/adr/adr-<num>-<name>.md` | Title / Context / Decision / Status / Consequence | ✅ 5건 ([인덱스](docs/adr/README.md)) |
| 3. **UI Spec** | `docs/ui/ui-<num>-<name>.md` | Title / Layout / Components / User Story | ✅ 8건 ([인덱스](docs/ui/README.md)) |
| 4. **Test Spec** | `test/<num>/test-<num>-<name>.md` | Title / Case / Input / Expected Output / Acceptance Criteria | ✅ 6건 ([인덱스](test/README.md)) |
| 5. **Todo** | `todo/todo-<num>-<date>.md` | List | ✅ 1건 |
| 6. **SKILL** | `skills/tidyx/<name>/SKILL.md` | name / description / Goal / Inputs / Procedure / Verification / Constraints | ✅ 2건 |
| 7. **Scripts** | `scripts/<name>.sh` | Bash | ✅ 4건 (`dev`, `reset-db`, `seed`, `test`) |

## 🗂️ 전체 디렉토리 맵

```
skills-main/
├── AGENTS.md                       # ① 루트 컨텍스트
├── AGENTS.skills-legacy.md         # (Matt Pocock skills 원본 백업)
├── HARNESS_INDEX.md                # 이 파일
│
├── docs/
│   ├── adr/                        # ② 설계 결정 5건
│   │   ├── README.md
│   │   ├── adr-001-monorepo-structure.md
│   │   ├── adr-002-sqlite-for-prototype.md
│   │   ├── adr-003-oauth-state-in-memory.md
│   │   ├── adr-004-llm-call-pattern.md
│   │   ├── adr-005-cookie-session-vs-jwt.md
│   │   └── 0001-explicit-setup-pointer-only-for-hard-dependencies.md  # (legacy)
│   │
│   └── ui/                         # ③ 화면 명세 8건
│       ├── README.md
│       ├── ui-001-login.md
│       ├── ui-002-issues-list.md
│       ├── ui-003-pull-requests.md
│       ├── ui-004-projects.md
│       ├── ui-005-labels.md
│       ├── ui-006-summary.md
│       ├── ui-007-repository.md
│       └── ui-008-item-detail.md
│
├── test/                           # ④ QA 테스트 명세 6건
│   ├── README.md
│   ├── 001/test-001-auth-oauth.md
│   ├── 002/test-002-repository-sync.md
│   ├── 003/test-003-issue-analysis.md
│   ├── 004/test-004-label-recommendation.md
│   ├── 005/test-005-duplicate-detection.md
│   └── 006/test-006-priority-recommendation.md
│
├── todo/                           # ⑤ 진행 트래킹
│   └── todo-001-2026-05-26.md
│
├── scripts/                        # ⑦ Bash 자동화
│   ├── dev.sh                      # 개발 서버 동시 실행
│   ├── reset-db.sh                 # DB 초기화
│   ├── seed.sh                     # 시드 데이터 적용
│   └── test.sh                     # 테스트 일괄 실행
│
└── skills/
    ├── tidyx/                      # ⑥ TidyX 전용 SKILL 2건
    │   ├── add-feature-module/SKILL.md
    │   └── run-prisma-migration/SKILL.md
    └── (engineering/ productivity/ ... 등은 Matt Pocock skills, TidyX와 무관)
```

## 🧭 신규 협업자를 위한 읽기 순서

1. **`AGENTS.md`** — 프로젝트 전체 개요
2. **`docs/adr/README.md`** → 핵심 ADR 5건 (왜 이런 결정을 했는가)
3. **`docs/ui/README.md`** → 본인이 만질 화면의 UI 명세
4. **`test/README.md`** → 해당 화면/기능의 QA 케이스
5. **`skills/tidyx/`** → 자주 하는 작업의 표준 절차
6. **`scripts/`** → 일상 명령

## 🔄 산출물 작성 사이클

```
새 기능 제안
    ↓
ADR 작성  ──→ docs/adr/adr-<num>-<name>.md
    ↓
UI 명세  ──→ docs/ui/ui-<num>-<name>.md  (UI 변경 시)
    ↓
QA 케이스 ──→ test/<num>/test-<num>-<name>.md
    ↓
구현     ──→ backend/ or frontend/  (+ __tests__/, __fixtures__/)
    ↓
Todo 갱신 ──→ todo/todo-<num>-<date>.md
    ↓
반복 작업이면 SKILL화 ──→ skills/tidyx/<name>/SKILL.md
```

## 📚 참고 강의 자료

- [8_software_testing.pdf](../소프트웨어%20공학/8_software_testing.pdf) — 테스팅 원리·계층
- [11_software+harness_engineering.pdf](../소프트웨어%20공학/11_software+harness_engineering.pdf) — Harness Engineering 양식 정의
- [4_requirements_engineering.pdf](../소프트웨어%20공학/4_requirements_engineering.pdf) — 요구사항 명세 (UI/ADR 보조)
