# 📦 TidyX 모노레포 개발 가이드

> Frontend + Backend + Skills 통합 프로젝트

## 📁 프로젝트 구조

```
skills-main 3/
├── frontend/                    # React + Vite 프론트엔드
│   ├── src/
│   │   ├── shared/             # 공유 유틸리티
│   │   ├── features/           # Feature 모듈
│   │   ├── infrastructure/     # HTTP, 스토리지
│   │   └── pages/
│   ├── vitest.config.ts
│   ├── .eslintrc.json
│   └── package.json
│
├── backend/                     # NestJS 백엔드
│   ├── src/
│   │   ├── auth/               # 인증 모듈
│   │   ├── repositories/       # 저장소 모듈
│   │   ├── analysis/           # 분석 모듈
│   │   ├── common/             # 공유 모듈
│   │   └── prisma.service.ts
│   ├── jest.config.js
│   ├── prisma/                 # DB 스키마
│   └── package.json
│
├── frontend/docs/              # Frontend 개발 가이드
├── backend/DEVELOPMENT.md       # Backend 개발 가이드
│
├── .github/
│   ├── workflows/              # CI/CD 파이프라인
│   └── ISSUE_TEMPLATE/         # 이슈 템플릿
│
├── TidyX/                       # 템플릿 (참고용)
├── skills/                      # Skill 모듈
├── docs/                        # 문서
└── scripts/                     # 유틸리티 스크립트
```

## 🚀 빠른 시작

### 전체 프로젝트 설정

```bash
# 1. 루트에서 의존성 설치
npm install

# 2. Frontend 의존성
cd frontend
npm install
cd ..

# 3. Backend 의존성
cd backend
npm install
npm run prisma:generate
cd ..
```

### 개발 서버 실행

#### 옵션 1: 분리 실행 (권장)

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# http://localhost:5173

# Terminal 2: Backend
cd backend
npm run start:dev
# http://localhost:3000
```

#### 옵션 2: 루트에서 동시 실행 (설정 필요)

```bash
# 루트 package.json에 dev 스크립트 추가
npm run dev
```

## 📚 문서 읽기 순서

### 1. 전체 아키텍처
1. **[HARNESS_ENGINEERING.md](./HARNESS_ENGINEERING.md)** - 핵심 원칙 (5분)
2. **[ARCHITECTURE_MIGRATION.md](./ARCHITECTURE_MIGRATION.md)** - 변경사항 (5분)

### 2. Frontend 개발
- **[frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)** - Feature 개발 가이드

### 3. Backend 개발
- **[backend/DEVELOPMENT.md](./backend/DEVELOPMENT.md)** - Module 개발 가이드

### 4. 참고 자료
- **[TidyX/QUICK_START.md](./TidyX/QUICK_START.md)** - 빠른 시작 템플릿
- **[TidyX/TEAM_SETUP.md](./TidyX/TEAM_SETUP.md)** - 팀 협업 가이드

## 💻 자주 사용하는 명령어

### Frontend

```bash
cd frontend

# 개발
npm run dev

# 테스트
npm run test
npm run test:ui
npm run test:coverage

# 코드 품질
npm run lint
npm run format
npm run type-check

# 빌드
npm run build
npm run preview
```

### Backend

```bash
cd backend

# 개발
npm run start:dev

# 테스트
npm run test
npm run test:watch
npm run test:cov

# 데이터베이스
npm run prisma:generate
npm run prisma:db:push
npm run db:init

# 빌드
npm run build
npm run start:prod
```

## 🎯 4가지 핵심 원칙

### 1. 모듈 독립성
각 모듈은 Mock/Fixture로 독립적으로 테스트 가능해야 합니다.

### 2. 계층 분리

**Frontend:**
```
Components → Hooks → Services → API → Infrastructure
```

**Backend:**
```
Controllers → Services → Repositories → Database
```

역방향 의존은 **금지**!

### 3. 테스트 하네스
모든 비즈니스 로직 모듈에 다음이 필수입니다:

```
module/
├── __tests__/              # 테스트 파일
├── __fixtures__/           # Mock 데이터
└── module.ts              # 구현
```

### 4. Feature 기반 조직
기능별로 관련 코드를 한곳에 모으기:

```
features/auth/             # 인증 관련 모든 코드
├── components/
├── services/
├── api/
└── types/
```

## 🆕 새로운 Feature/Module 추가

### Frontend: 새로운 Feature 추가

```bash
cd frontend
mkdir -p src/features/my-feature/{components,services,api,hooks,types,__tests__}

# 그 다음 DEVELOPMENT.md의 "Step 2: Types 정의"부터 시작
```

### Backend: 새로운 Module 추가

```bash
cd backend
nest g module src/my-module
nest g service src/my-module/my-module
nest g controller src/my-module/my-module

# 그 다음 DEVELOPMENT.md의 "Step 4: DTOs 정의"부터 시작
```

## 🧪 테스트 전략

### Frontend 테스트

| 계층 | 타입 | 위치 | 목표 |
|------|------|------|------|
| Services | 단위 테스트 | `features/[name]/services/__tests__/` | 90%+ |
| Components | 단위 테스트 | `features/[name]/components/__tests__/` | 80%+ |
| Hooks | 단위 테스트 | `features/[name]/hooks/__tests__/` | 85%+ |
| E2E | 통합 테스트 | `tests/e2e/` | 주요 시나리오 |

### Backend 테스트

| 계층 | 타입 | 파일명 | 목표 |
|------|------|--------|------|
| Services | 단위 테스트 | `src/[module]/__tests__/[module].service.spec.ts` | 90%+ |
| Controllers | 통합 테스트 | `src/[module]/__tests__/[module].controller.spec.ts` | 80%+ |
| E2E | E2E 테스트 | `tests/e2e/` | 주요 API |

## 📝 Git 워크플로우

### 브랜치 전략

```
main (프로덕션)
├── develop (개발 브랜치)
│   ├── feature/auth
│   ├── feature/repositories
│   └── feature/analysis
```

### 커밋 메시지 규칙

```
[TYPE](scope): 간단한 설명

자세한 설명 (필요시)

관련 이슈: #123
```

**TYPE**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
**SCOPE**: `frontend`, `backend`, `infra`, `docs`

예시:
```
[feat](frontend): add auth login form

- Add email and password inputs
- Add form validation
- Add error message display

관련 이슈: #42
```

## 🔄 CI/CD 파이프라인

### 자동 실행

- **Pull Request 생성 시**:
  - ESLint / Prettier 검사
  - TypeScript 타입 검사
  - 모든 테스트 실행
  - 커버리지 리포트 생성

- **Merge to main**:
  - 자동 빌드
  - 자동 배포 (설정 필요)

### 워크플로우 파일 위치

```
.github/workflows/
├── test.yml         # 테스트 파이프라인
└── build.yml        # 빌드 파이프라인 (예정)
```

## 🚨 체크리스트

### Feature 개발 시

- [ ] Feature 폴더 구조 생성
- [ ] Types 정의
- [ ] API/Services 구현
- [ ] 테스트 작성
- [ ] 커버리지 확인 (목표 달성)
- [ ] 문서 작성
- [ ] PR 작성 (템플릿 사용)
- [ ] 코드 리뷰

### PR 생성 시

- [ ] 브랜치 이름 규칙 준수
- [ ] 커밋 메시지 규칙 준수
- [ ] 테스트 모두 통과
- [ ] 린트/포맷 검사 통과
- [ ] 타입 검사 통과
- [ ] PR 템플릿 사용
- [ ] 스크린샷/설명 추가 (필요시)

## 🔑 주요 파일들

### 설정 파일
- `.eslintrc.json` - ESLint 규칙 (루트 + 각 프로젝트)
- `.prettierrc.json` - Prettier 포맷팅 (루트 + 각 프로젝트)
- `frontend/vite.config.ts` - Frontend 빌드 설정
- `frontend/vitest.config.ts` - Frontend 테스트 설정
- `backend/jest.config.js` - Backend 테스트 설정
- `backend/tsconfig.json` - Backend TypeScript 설정
- `backend/prisma/schema.prisma` - 데이터베이스 스키마

### 문서
- `HARNESS_ENGINEERING.md` - 아키텍처 원칙
- `ARCHITECTURE_MIGRATION.md` - 변경사항
- `frontend/DEVELOPMENT.md` - Frontend 개발 가이드
- `backend/DEVELOPMENT.md` - Backend 개발 가이드
- `MONOREPO_GUIDE.md` - 이 문서

## ⚠️ 주의사항

### Frontend

❌ **하지 말 것:**
- Component에서 직접 API 호출
- 과도한 props drilling
- 상대 경로 import (../../../)

✅ **해야 할 것:**
- Hook을 통한 데이터 접근
- Context/Store로 전역 상태 관리
- Path aliases 사용 (@/shared/@features)

### Backend

❌ **하지 말 것:**
- Controller에서 직접 DB 접근
- Service에서 HTTP 응답 생성
- 테스트 없이 배포

✅ **해야 할 것:**
- Service의 비즈니스 로직 처리
- Controller에서 HTTP 처리
- 항상 테스트 작성

## 📞 자주 묻는 질문

**Q: 언제 Frontend를, 언제 Backend를 수정하나요?**
A: 사용자 인터페이스/상태 관리는 Frontend, 비즈니스 로직/데이터는 Backend

**Q: 새로운 API는 어떻게 추가하나요?**
A: Backend에 controller/service 추가 → Frontend에 api/service 추가 → Hook으로 통합

**Q: 테스트가 복잡해 보여요.**
A: [frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)와 [backend/DEVELOPMENT.md](./backend/DEVELOPMENT.md)의 예시를 참고하세요.

**Q: 다른 팀원과 같은 Feature를 개발하려면?**
A: Git feature branch 전략을 사용하고 자주 Pull Request를 만드세요.

---

## 📖 추가 자료

- [Harness Engineering 원칙](./HARNESS_ENGINEERING.md)
- [Architecture 마이그레이션](./ARCHITECTURE_MIGRATION.md)
- [TidyX 템플릿](./TidyX/)
- [Skills 폴더](./skills/)

---

**Happy Coding! 🎉**

더 궁금한 점은 각 프로젝트의 DEVELOPMENT.md를 참고하세요.
