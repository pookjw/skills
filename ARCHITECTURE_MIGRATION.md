# 🔄 Harness Engineering 아키텍처 마이그레이션

> TidyX 프로젝트의 구조 개선 요약

## 📊 변경 사항

### Before (기존)

```
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── lib/api.ts      ❌ 모듈화 없음
└── (테스트 없음)

backend/
├── src/
│   ├── analysis/       ✓ 기본 feature 구조는 있음
│   ├── auth/
│   ├── repositories/
│   └── (테스트 하네스 부재)
└── (테스트 프레임워크 없음)
```

### After (개선)

```
frontend/
├── src/
│   ├── shared/         ✓ 공유 유틸리티
│   ├── features/       ✓ Feature 기반 모듈화
│   │   ├── auth/       ✓ 완전한 모듈 구조
│   │   ├── repositories/
│   │   └── analysis/
│   ├── infrastructure/ ✓ 계층 분리
│   └── pages/
├── tests/              ✓ 테스트 디렉토리
├── vitest.config.ts   ✓ 테스트 설정
└── (테스트 프레임워크 추가)

backend/
├── src/
│   ├── common/         ✓ 공유 가드/필터/인터셉터
│   ├── auth/           ✓ 테스트 하네스 추가
│   │   ├── __tests__/
│   │   ├── __fixtures__/
│   │   └── ...
│   ├── repositories/   ✓ 테스트 구조 추가
│   ├── analysis/
│   └── database/       ✓ DB 계층 분리
├── tests/              ✓ E2E/통합 테스트
├── jest.config.js      ✓ 테스트 설정
└── (테스트 프레임워크 추가)
```

---

## ✅ 생성된 구조 요소

### Frontend

#### 📁 디렉토리 구조
- ✅ `src/shared/` - 공유 유틸리티/타입/훅/컴포넌트
- ✅ `src/features/` - Feature 모듈 (auth, repositories, analysis)
- ✅ `src/infrastructure/` - HTTP, 스토리지, 에러 처리
- ✅ `src/pages/` - 페이지 컴포넌트
- ✅ `tests/` - E2E/통합 테스트

#### ⚙️ 설정 파일
- ✅ `vitest.config.ts` - Vitest 설정
- ✅ `vitest.setup.ts` - 테스트 환경 설정
- ✅ `.eslintrc.json` - ESLint 규칙
- ✅ `.prettierrc.json` - Prettier 포맷팅
- ✅ `tsconfig.app.json` - Path aliases 추가

#### 📚 문서
- ✅ `DEVELOPMENT.md` - Feature 개발 가이드 (예시 포함)

### Backend

#### 📁 디렉토리 구조
- ✅ `src/common/` - 공유 guards/filters/interceptors/pipes
- ✅ `src/[module]/__tests__/` - 각 모듈별 테스트
- ✅ `src/[module]/__fixtures__/` - Mock 데이터
- ✅ `tests/` - E2E/통합 테스트 디렉토리

#### ⚙️ 설정 파일
- ✅ `jest.config.js` - Jest 설정
- ✅ `package.json` - 테스트 스크립트 추가

#### 📚 문서
- ✅ `DEVELOPMENT.md` - Module 개발 가이드 (예시 포함)

### 프로젝트 전체

#### 📚 문서
- ✅ `HARNESS_ENGINEERING.md` - Harness Engineering 원칙 설명
- ✅ `ARCHITECTURE_MIGRATION.md` - 이 문서

---

## 🚀 다음 단계

### 1️⃣ 기존 코드 마이그레이션 (선택사항)

Frontend의 기존 코드를 새로운 구조로 옮기기:

```bash
# 기존 api.ts를 Feature 구조로 분해
frontend/src/lib/api.ts → features/[feature]/api/

# 기존 컴포넌트를 Feature 단위로 이동
frontend/src/components/ → features/[feature]/components/
```

### 2️⃣ 테스트 추가

```bash
# Frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Backend  
npm install --save-dev jest @nestjs/testing ts-jest @types/jest
```

### 3️⃣ 첫 번째 Feature 개발

Frontend:
```bash
# 예: Auth feature
mkdir -p src/features/auth/__tests__/
# src/features/auth/types/auth.types.ts 작성
# src/features/auth/api/authAPI.ts 작성
# ... 단계별 진행 (DEVELOPMENT.md 참고)
```

Backend:
```bash
# 예: User module
nest g module src/user
nest g service src/user/user
nest g controller src/user/user
# ... 단계별 진행 (DEVELOPMENT.md 참고)
```

### 4️⃣ CI/CD 설정

`.github/workflows/` 추가 예정:
- `test.yml` - 자동 테스트
- `build.yml` - 빌드 파이프라인

---

## 📖 문서 읽기 순서

1. **[HARNESS_ENGINEERING.md](./HARNESS_ENGINEERING.md)** (5분)
   - 프로젝트 전체 구조 이해

2. **[frontend/DEVELOPMENT.md](./frontend/DEVELOPMENT.md)** (Frontend 개발시)
   - Feature 추가 가이드
   - 계층 분리 원칙
   - 예제 코드

3. **[backend/DEVELOPMENT.md](./backend/DEVELOPMENT.md)** (Backend 개발시)
   - Module 추가 가이드
   - Service/Controller 작성
   - 테스트 작성

---

## 🧪 테스트 커버리지 목표

### Frontend
| 계층 | 목표 | 위치 |
|------|------|------|
| Services | 90%+ | `features/[feature]/services/__tests__/` |
| Components | 80%+ | `features/[feature]/components/__tests__/` |
| Hooks | 85%+ | `features/[feature]/hooks/__tests__/` |

### Backend
| 계층 | 목표 | 파일명 |
|------|------|--------|
| Services | 90%+ | `src/[module]/__tests__/[module].service.spec.ts` |
| Controllers | 80%+ | `src/[module]/__tests__/[module].controller.spec.ts` |

---

## 💻 개발 명령어

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

# 빌드
npm run build
npm run start:prod
```

---

## 🎯 핵심 원칙 체크리스트

### 모듈 추가 시

- [ ] Feature 폴더 구조 생성
- [ ] Types 정의
- [ ] API/Service 계층 분리
- [ ] 테스트 작성 (__tests__, __fixtures__)
- [ ] 공개 API 정의 (index.ts)
- [ ] 문서 작성

### 코드 리뷰 시

- [ ] 계층 분리 확인 (역방향 의존 없음)
- [ ] 테스트 커버리지 확인
- [ ] 모듈 독립성 확인
- [ ] Path aliases 사용 확인
- [ ] Git 메시지 규칙 준수

---

## 🔄 마이그레이션 로드맵

### Phase 1: 구조 준비 ✅ (완료)
- ✅ 디렉토리 구조 생성
- ✅ 설정 파일 추가
- ✅ 문서 작성

### Phase 2: 기존 코드 마이그레이션 (진행중)
- ⏳ Frontend 컴포넌트 이동
- ⏳ API 레이어 재구성
- ⏳ Backend 모듈 테스트 하네스 추가

### Phase 3: 테스트 작성 (예정)
- ⏳ Frontend 테스트 작성
- ⏳ Backend 테스트 작성
- ⏳ E2E 테스트 추가

### Phase 4: CI/CD 설정 (예정)
- ⏳ GitHub Actions 워크플로우
- ⏳ 자동 테스트
- ⏳ 배포 파이프라인

---

## 📞 질문과 답변

**Q: 기존 코드를 모두 새 구조로 옮겨야 하나요?**
A: 아니요. 점진적으로 진행할 수 있습니다. 새로운 Feature부터 새 구조를 사용하세요.

**Q: 테스트를 반드시 작성해야 하나요?**
A: Service와 비즈니스 로직은 필수, Component는 80%+ 권장합니다.

**Q: 기존 코드와 새 구조를 섞어도 되나요?**
A: 가능하지만, 같은 Feature 내에서는 일관되게 구성하세요.

**Q: Path aliases를 사용하지 않아도 되나요?**
A: 가능하지만, 상대 경로가 깊어지면 유지보수가 어렵습니다. 권장합니다.

---

## 🎉 완료!

이제 Harness Engineering 기반의 프로젝트 구조가 준비되었습니다.

**다음 단계:**
1. 각 팀원이 개발 가이드 읽기
2. 첫 번째 Feature/Module 구현 시작
3. 테스트 작성
4. 코드 리뷰

Happy Coding! 🚀
