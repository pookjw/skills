# TidyX QA / Test Documents

> Harness Engineering의 `test-<number>-<name>.md` 양식에 따라 작성된 QA 문서 모음입니다.
> 강의자료 **8_software_testing.pdf** (테스팅 원리)와 **11_software+harness_engineering.pdf** (문서 템플릿)를 기반으로 작성되었습니다.

## 📋 테스트 문서 목록

| # | 문서 | 대상 기능 | 테스트 레벨 |
|---|------|-----------|-------------|
| 001 | [test-001-auth-oauth](./001/test-001-auth-oauth.md) | GitHub OAuth 로그인·세션 관리 | Component |
| 002 | [test-002-repository-sync](./002/test-002-repository-sync.md) | 저장소 연동 및 이슈/PR 동기화 | System |
| 003 | [test-003-issue-analysis](./003/test-003-issue-analysis.md) | AI 기반 통합 분석 실행 | System |
| 004 | [test-004-label-recommendation](./004/test-004-label-recommendation.md) | 자동 라벨 추천 | Component |
| 005 | [test-005-duplicate-detection](./005/test-005-duplicate-detection.md) | 중복 이슈 검사 | Component + Unit |
| 006 | [test-006-priority-recommendation](./006/test-006-priority-recommendation.md) | 이슈 우선순위 추천 | Component |

## 🏗️ 테스팅 전략 (강의자료 기반)

### 1. 테스팅의 두 축
- **Validation testing** (정상 동작 확인) — 각 문서의 "Validation" 태그 케이스
- **Defect testing** (오류 발견) — 각 문서의 "Defect", "Boundary", "Security", "Stress" 태그 케이스

### 2. 개발 테스팅 3계층 매핑
| 계층 | 적용 문서 | 검증 대상 |
|------|----------|----------|
| **Unit testing** | test-005 (text-similarity.ts) | 순수 함수 |
| **Component testing** | test-001, 003, 004, 005, 006 | Controller ↔ Service ↔ DB |
| **System testing** | test-002, 003 (대량/스트레스 케이스) | 외부 API(GitHub, OpenAI) 통합 |

### 3. 사용자 테스팅 권장
- **Alpha**: 개발팀이 실제 GitHub 계정으로 전체 시나리오 수행
- **Beta**: 외부 사용자가 자신의 저장소로 전체 흐름 시험
- **Acceptance**: test-001 ~ test-006의 Validation 케이스 100% 통과 시 릴리즈 후보

## 📐 사용한 템플릿 (11번 강의 7페이지)

```markdown
# test-<number>-<name>.md
## Title: <테스트 명>
## Case 1:
### Input: (입력)
### Expected Output: (예상 출력)
### Acceptance Criteria: (인수 기준)
## Case 2:
...
```

## 🧪 테스트 실행 단계 (강의 8번 8페이지)

```
1. Design test cases  →  2. Prepare test data  →  3. Run program  →  4. Compare results
```

각 케이스는 위 4단계에 매핑됩니다:
- **Design**: 각 Case의 `Input`/`Expected Output` 정의
- **Prepare**: 사전 조건(prerequisites) 명시
- **Run**: HTTP 요청 또는 함수 호출
- **Compare**: `Acceptance Criteria`로 검증

## 🔁 권장 자동화

강의 8번 11페이지의 unit testing 가이드라인에 따라, 모든 케이스는 **자동화 가능한 형태**로 작성되었습니다.

- **Backend** (`backend/`): Jest로 unit·component 테스트 작성
  ```bash
  cd backend && npm run test
  ```
- **Frontend** (`frontend/`): Vitest로 컴포넌트·서비스 테스트
  ```bash
  cd frontend && npm run test
  ```
- **E2E / 시나리오**: Playwright 또는 Postman collection으로 test-002의 케이스 시퀀스 자동화 권장

## 📊 결함 보고 양식 (참고)

테스트 케이스 실패 시 다음 형식으로 결함 보고:

```markdown
### Defect Report - <테스트 케이스 ID>
- **Test Case**: test-XXX Case N
- **Severity**: Critical / High / Medium / Low
- **Environment**: <OS, 브라우저, 백엔드 버전>
- **Steps to Reproduce**: <재현 단계>
- **Expected**: <기대 결과>
- **Actual**: <실제 결과>
- **Logs/Screenshot**: <첨부>
```

## 📚 참고 강의 자료

- `8_software_testing.pdf` — 테스팅의 정의, 3단계, 가이드라인, TDD
- `11_software+harness_engineering.pdf` — `test-<num>-<name>.md` 템플릿
- `4_requirements_engineering.pdf` — 요구사항 기반 테스팅, 검증 기준
