# 🏗️ Harness Engineering 아키텍처

> TidyX 프로젝트의 Harness Engineering 기반 구조

## 📋 개요

이 프로젝트는 **Harness Engineering** 원칙에 따라 다음과 같이 구성됩니다:

- **모듈 독립성**: 각 모듈은 독립적으로 테스트 가능
- **계층 분리**: 명확한 의존성 방향
- **테스트 하네스**: 모든 모듈에 대응하는 테스트 코드
- **Feature 기반 조직**: 기능 단위로 디렉토리 구성

---

## 🏛️ 프로젝트 구조

### Frontend (React + Vite)

```
frontend/src/
├── shared/                  # 공유 유틸리티
│   ├── utils/              # 유틸 함수
│   ├── constants/          # 상수
│   ├── types/              # 공유 타입
│   ├── hooks/              # 공유 커스텀 훅
│   ├── components/         # 공유 컴포넌트
│   └── lib/                # 라이브러리 설정
│
├── features/               # Feature 모듈 (Feature-based)
│   ├── auth/               # 인증 기능
│   │   ├── components/     # 인증 UI
│   │   ├── services/       # 비즈니스 로직
│   │   ├── api/            # API 요청
│   │   ├── hooks/          # Feature 훅
│   │   ├── types/          # Feature 타입
│   │   └── __tests__/      # 테스트
│   │
│   ├── repositories/       # GitHub 저장소 관리
│   │   ├── components/
│   │   ├── services/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── __tests__/
│   │
│   └── analysis/           # 분석 기능
│       ├── components/
│       ├── services/
│       ├── api/
│       ├── hooks/
│       ├── types/
│       └── __tests__/
│
├── infrastructure/         # 인프라 계층
│   ├── http/              # HTTP 클라이언트
│   ├── storage/           # 로컬 스토리지
│   └── errors/            # 에러 처리
│
├── pages/                 # 페이지 레이아웃
├── App.tsx
└── main.tsx
```

### Backend (NestJS + Prisma)

```
backend/src/
├── common/                 # 공유 모듈
│   ├── guards/            # 인증/인가 가드
│   ├── filters/           # 에러 필터
│   ├── interceptors/      # HTTP 인터셉터
│   └── pipes/             # 유효성 검사
│
├── auth/                   # 인증 모듈
│   ├── dto/               # Data Transfer Objects
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── __tests__/
│   └── __fixtures__/
│
├── repositories/          # GitHub 저장소 동기화
│   ├── dto/
│   ├── repositories.controller.ts
│   ├── repositories.service.ts
│   ├── __tests__/
│   └── __fixtures__/
│
├── analysis/              # GitHub 데이터 분석
│   ├── dto/
│   ├── analysis.controller.ts
│   ├── analysis.service.ts
│   ├── utils/             # 분석 유틸리티
│   ├── __tests__/
│   └── __fixtures__/
│
├── health/                # 헬스 체크
├── database/              # DB 관련
├── app.module.ts
└── main.ts
```

---

## 🎯 핵심 원칙

### 1. 모듈 독립성

각 모듈은 **다른 모듈 없이 독립적으로 테스트 가능**해야 합니다.

```typescript
// ✅ 좋은 예: Mock으로 의존성 제거
const mockAuthService = {
  login: vi.fn().mockResolvedValue({ user: testUser }),
}

// ❌ 나쁜 예: 실제 HTTP 요청
const user = await fetch('/api/login')
```

### 2. 계층 분리 (Frontend)

```
Components (UI)
    ↓
Custom Hooks (React 통합)
    ↓
Services (비즈니스 로직)
    ↓
API Layer (데이터 접근)
    ↓
Infrastructure (HTTP, Storage)
```

**역방향 의존은 금지!**

```typescript
// ❌ 금지: Component가 직접 API 호출
const MyComponent = () => {
  useEffect(() => {
    fetch('/api/data').then(setData)
  }, [])
}

// ✅ 허용: Service → Hook → Component
const useData = () => {
  return useQuery(() => dataService.getData())
}

const MyComponent = () => {
  const data = useData()
}
```

### 3. 테스트 하네스

모든 비즈니스 로직 모듈에는 다음이 필수입니다:

```
module/
├── __tests__/           # 테스트 파일
│   ├── module.spec.ts
│   └── __fixtures__/    # Mock 데이터
│       └── mockData.ts
├── module.ts           # 구현
└── module.types.ts     # 타입
```

### 4. Feature 기반 조직

기능별로 관련된 코드를 한곳에 모으기:

```
features/
├── auth/               # 인증 관련 모든 코드
│   ├── components/
│   ├── services/
│   ├── api/
│   └── types/
└── repositories/       # 저장소 관련 모든 코드
    ├── components/
    ├── services/
    ├── api/
    └── types/
```

---

## 📊 의존성 흐름

### Frontend

```
       Pages/App
           ↓
    UI Components
           ↓
    Custom Hooks
           ↓
    Services (비즈니스 로직)
           ↓
    API Layer
           ↓
Infrastructure (HTTP, 스토리지, 에러)
```

### Backend

```
    REST Controllers
           ↓
    NestJS Services
           ↓
    Repositories (Prisma)
           ↓
    Database
```

---

## 🧪 테스트 전략

### Frontend

| 계층 | 테스트 타입 | 위치 | 커버리지 |
|------|-----------|------|---------|
| Components | 단위 테스트 | `components/__tests__/` | 80%+ |
| Services | 단위 테스트 | `services/__tests__/` | 90%+ |
| Hooks | 단위 테스트 | `hooks/__tests__/` | 85%+ |
| E2E | 통합 테스트 | `tests/e2e/` | 주요 시나리오 |

### Backend

| 계층 | 테스트 타입 | 파일명 | 커버리지 |
|------|-----------|--------|---------|
| Services | 단위 테스트 | `*.spec.ts` | 90%+ |
| Controllers | 통합 테스트 | `*.spec.ts` | 80%+ |
| E2E | E2E 테스트 | `tests/e2e/` | 주요 API |

---

## 🚀 개발 가이드

### Frontend Feature 추가

1. **폴더 생성**
   ```bash
   mkdir -p src/features/my-feature/{components,services,api,hooks,types,__tests__}
   ```

2. **타입 정의** (`types/my-feature.types.ts`)
   ```typescript
   export interface MyFeatureState {
     data: unknown
     loading: boolean
     error: string | null
   }
   ```

3. **API 레이어** (`api/myFeatureAPI.ts`)
   ```typescript
   export const myFeatureAPI = {
     getData: async () => {
       return fetch('/api/my-feature').then(r => r.json())
     },
   }
   ```

4. **Services** (`services/myFeatureService.ts`)
   ```typescript
   export const myFeatureService = {
     async getData() {
       return myFeatureAPI.getData()
     },
   }
   ```

5. **Hooks** (`hooks/useMyFeature.ts`)
   ```typescript
   export const useMyFeature = () => {
     const [data, setData] = useState(null)
     useEffect(() => {
       myFeatureService.getData().then(setData)
     }, [])
     return data
   }
   ```

6. **Components** (`components/MyFeature.tsx`)
   ```typescript
   export const MyFeature = () => {
     const data = useMyFeature()
     return <div>{data}</div>
   }
   ```

7. **테스트** (`__tests__/myFeatureService.spec.ts`)
   ```typescript
   describe('myFeatureService', () => {
     it('should get data', async () => {
       const data = await myFeatureService.getData()
       expect(data).toBeDefined()
     })
   })
   ```

8. **공개 API** (`index.ts`)
   ```typescript
   export { useMyFeature } from './hooks/useMyFeature'
   export { MyFeature } from './components/MyFeature'
   export type { MyFeatureState } from './types/my-feature.types'
   ```

### Backend Module 추가

```bash
nest g module my-module
nest g service my-module/my-module
nest g controller my-module/my-module
```

---

## 💻 명령어

### Frontend

```bash
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
# 개발
npm run start:dev

# 테스트
npm run test
npm run test:watch
npm run test:cov

# 빌드
npm run build
npm run start:prod

# DB
npm run prisma:generate
npm run prisma:db:push
```

---

## 📚 관련 문서

- **[Frontend DEVELOPMENT.md](./frontend/docs/DEVELOPMENT.md)** - Frontend 개발 가이드
- **[Backend README.md](./backend/README.md)** - Backend 개발 가이드
- **[TidyX 가이드](./TidyX/QUICK_START.md)** - TidyX 템플릿 참고

---

## ✅ 체크리스트

### Feature 개발 시

- [ ] Feature 폴더 구조 생성
- [ ] Types 정의
- [ ] API 레이어 구현
- [ ] Services 구현 및 테스트
- [ ] Hooks 구현 및 테스트
- [ ] Components 구현 및 테스트
- [ ] 공개 API 정의 (index.ts)
- [ ] 문서 작성

---

**Happy Coding! 🎉**
