# 🎯 TidyX - GitHub Repository Analyzer

> Harness Engineering 기반의 모노레포 프로젝트  
> React + NestJS + Prisma를 사용한 GitHub 저장소 분석 플랫폼

## 📋 프로젝트 개요

TidyX는 GitHub 저장소의 이슈를 분석하고 정리하는 AI 기반 도구입니다.

### 주요 기능

- 🔐 **OAuth2 인증** - GitHub 계정으로 안전하게 로그인
- 🔄 **저장소 동기화** - GitHub 저장소 자동 연동
- 📊 **데이터 분석** - AI를 활용한 이슈 분석
- 🏷️ **자동 라벨링** - 이슈 자동 분류
- 🔍 **중복 검사** - 중복 이슈 감지
- ⭐ **우선순위 분석** - 이슈 우선순위 자동 추천

## 🏗️ 기술 스택

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **Testing**: Vitest + Testing Library

### Backend
- **Framework**: NestJS 10
- **ORM**: Prisma
- **Database**: SQLite (개발), PostgreSQL (프로덕션)
- **AI**: OpenAI API
- **Testing**: Jest

### 개발 방법론
- **아키텍처**: Harness Engineering
- **구조**: Monorepo (Frontend + Backend)
- **코드 품질**: ESLint + Prettier
- **CI/CD**: GitHub Actions

## 📖 문서 구조

> **처음이신가요?** [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md)부터 읽으세요!

### 핵심 문서

1. **[MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md)** ⭐⭐⭐
   - 모노레포 개요 및 개발 가이드
   - **이 문서부터 읽기!**

2. **[HARNESS_ENGINEERING.md](./HARNESS_ENGINEERING.md)**
   - Harness Engineering 원칙
   - 4가지 핵심 원칙 설명

3. **[ARCHITECTURE_MIGRATION.md](./ARCHITECTURE_MIGRATION.md)**
   - 구조 개선 사항
   - Before/After 비교

### Frontend

- **[frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)** - Feature 개발 가이드 (예시 포함)
- **[frontend/package.json](./frontend/package.json)** - 의존성 관리
- **[frontend/src](./frontend/src)** - 소스 코드

### Backend

- **[backend/DEVELOPMENT.md](./backend/DEVELOPMENT.md)** - Module 개발 가이드 (예시 포함)
- **[backend/package.json](./backend/package.json)** - 의존성 관리
- **[backend/prisma](./backend/prisma)** - DB 스키마
- **[backend/src](./backend/src)** - 소스 코드

### 참고 자료

- **[TidyX/](./TidyX/)** - 프로젝트 템플릿 (참고용)
- **[skills/](./skills/)** - Skill 모듈 모음
- **.github/** - GitHub 협업 설정 (이슈/PR 템플릿, CI/CD)

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18+
- npm 9+
- Git

### 1단계: 저장소 클론

```bash
git clone https://github.com/your-username/tidyx.git
cd tidyx
```

### 2단계: 의존성 설치

```bash
# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
npm run prisma:generate
cd ..
```

### 3단계: 개발 서버 실행

#### Terminal 1: Frontend
```bash
cd frontend
npm run dev
# http://localhost:5173
```

#### Terminal 2: Backend
```bash
cd backend
npm run start:dev
# http://localhost:3000
# Swagger API: http://localhost:3000/api
```

## 💻 개발 명령어

### Frontend

```bash
cd frontend

npm run dev           # 개발 서버
npm run build         # 프로덕션 빌드
npm run test          # 테스트 실행
npm run test:ui       # UI 테스트 대시보드
npm run test:coverage # 커버리지 리포트
npm run lint          # ESLint 검사
npm run format        # Prettier 포맷팅
npm run type-check    # TypeScript 타입 검사
```

### Backend

```bash
cd backend

npm run start:dev        # 개발 서버 (watch 모드)
npm run build            # 빌드
npm run start:prod       # 프로덕션 실행
npm run test             # 테스트 실행
npm run test:watch       # Watch 모드
npm run test:cov         # 커버리지 리포트
npm run prisma:generate  # Prisma 클라이언트 생성
npm run prisma:db:push   # DB 마이그레이션
npm run db:init          # DB 초기화
```

## 🎯 프로젝트 구조

```
tidyx/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── shared/             # 공유 유틸리티
│   │   ├── features/           # Feature 모듈
│   │   │   ├── auth/
│   │   │   ├── repositories/
│   │   │   └── analysis/
│   │   ├── infrastructure/     # HTTP, 스토리지
│   │   └── pages/
│   ├── DEVELOPMENT.md          # Frontend 개발 가이드
│   └── package.json
│
├── backend/                     # NestJS 백엔드
│   ├── src/
│   │   ├── auth/               # 인증 모듈
│   │   ├── repositories/       # 저장소 모듈
│   │   ├── analysis/           # 분석 모듈
│   │   ├── common/             # 공유 모듈
│   │   └── main.ts
│   ├── prisma/                 # DB 스키마
│   ├── DEVELOPMENT.md          # Backend 개발 가이드
│   └── package.json
│
├── .github/                     # GitHub 협업
│   ├── workflows/              # CI/CD 파이프라인
│   └── ISSUE_TEMPLATE/         # 이슈 템플릿
│
├── docs/                        # 문서
├── skills/                      # Skill 모듈
├── TidyX/                       # 템플릿
│
├── MONOREPO_GUIDE.md           # 모노레포 가이드 (⭐ 읽기!)
├── HARNESS_ENGINEERING.md      # 아키텍처 원칙
├── ARCHITECTURE_MIGRATION.md   # 변경사항
└── README.md                   # 이 파일
```

## 🎓 개발 원칙

### Harness Engineering의 4가지 원칙

1. **모듈 독립성** - 각 모듈은 Mock으로 독립적으로 테스트 가능
2. **계층 분리** - 명확한 의존성 방향 (역방향 금지)
3. **테스트 하네스** - 모든 비즈니스 로직에 테스트 필수
4. **Feature 기반 조직** - 기능 단위로 관련 코드를 한곳에 모으기

### 의존성 흐름

**Frontend:**
```
Components → Hooks → Services → API → Infrastructure
```

**Backend:**
```
Controllers → Services → Repositories → Database
```

## 🧪 테스트 전략

### 커버리지 목표

| 계층 | 목표 |
|------|------|
| Frontend Services | 90%+ |
| Frontend Components | 80%+ |
| Backend Services | 90%+ |
| Backend Controllers | 80%+ |

### 테스트 작성

모든 비즈니스 로직 모듈은 다음 구조를 따릅니다:

```
module/
├── __tests__/              # 테스트 파일
├── __fixtures__/           # Mock 데이터
└── module.ts              # 구현
```

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
[TYPE](scope): 설명

자세한 설명 (필요시)

관련 이슈: #123
```

**TYPE**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
**SCOPE**: `frontend`, `backend`, `infra`, `docs`

### Pull Request

1. PR 템플릿 사용 (자동 제공)
2. 체크리스트 완료 필수
3. 최소 1명 리뷰 필수
4. 테스트 패스 필수

## 🆕 새로운 Feature 추가

### Frontend

[frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)의 "Feature 추가 가이드" 참고

```bash
mkdir -p src/features/my-feature/{components,services,api,hooks,types,__tests__}
```

### Backend

[backend/DEVELOPMENT.md](./backend/DEVELOPMENT.md)의 "Module 추가 가이드" 참고

```bash
nest g module src/my-module
nest g service src/my-module/my-module
nest g controller src/my-module/my-module
```

## 🔧 설정 파일

### ESLint & Prettier

```
.eslintrc.json          # Root + 각 프로젝트
.prettierrc.json        # Root + 각 프로젝트
```

### Frontend

- `frontend/vite.config.ts` - 빌드 설정
- `frontend/vitest.config.ts` - 테스트 설정
- `frontend/tsconfig.app.json` - TypeScript 설정 (Path aliases)

### Backend

- `backend/jest.config.js` - Jest 설정
- `backend/tsconfig.json` - TypeScript 설정
- `backend/prisma/schema.prisma` - DB 스키마

## 📚 추가 읽을거리

- [Harness Engineering 원칙](./HARNESS_ENGINEERING.md)
- [구조 마이그레이션](./ARCHITECTURE_MIGRATION.md)
- [Frontend 개발 가이드](./frontend/DEVELOPMENT.md)
- [Backend 개발 가이드](./backend/DEVELOPMENT.md)
- [모노레포 개발 가이드](./MONOREPO_GUIDE.md)

## 🤝 기여하기

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m '[feat](frontend): add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 질문과 피드백

- 버그 리포트: [Issues](https://github.com/your-username/tidyx/issues)
- 개선 제안: [Discussions](https://github.com/your-username/tidyx/discussions)

## 📄 라이센스

이 프로젝트는 [LICENSE](./LICENSE) 파일에 따릅니다.

---

## 🎉 시작하기

```bash
# 1. 저장소 클론
git clone <repository-url>
cd tidyx

# 2. 문서 읽기 (필수!)
cat MONOREPO_GUIDE.md

# 3. 개발 시작
cd frontend && npm install && npm run dev
cd ../backend && npm install && npm run start:dev
```

**Happy Coding! 🚀**

> **처음이신가요?** [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md)를 먼저 읽으세요!
