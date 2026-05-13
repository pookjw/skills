# 🛠️ Frontend 개발 가이드

> React + Vite + TypeScript  
> Harness Engineering 기반

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저에서 http://localhost:5173 열기
```

## 📁 프로젝트 구조

```
src/
├── shared/                 # 공유 유틸리티
│   ├── utils/
│   ├── constants/
│   ├── types/
│   ├── hooks/
│   ├── components/
│   └── lib/
│
├── features/               # Feature 모듈 (Feature-based)
│   ├── auth/
│   ├── repositories/
│   └── analysis/
│
├── infrastructure/         # 인프라 계층
│   ├── http/              # HTTP 클라이언트
│   ├── storage/           # 로컬 스토리지
│   └── errors/            # 에러 처리
│
├── pages/                 # 페이지 컴포넌트
├── App.tsx
└── main.tsx
```

## 🎯 계층 분리 원칙

```
UI Components
    ↓
Custom Hooks
    ↓
Services (비즈니스 로직)
    ↓
API Layer
    ↓
Infrastructure
```

**역방향 의존은 금지!**

## 🆕 Feature 추가 가이드

### Step 1: 폴더 구조 생성

```bash
mkdir -p src/features/my-feature/{components,services,api,hooks,types,__tests__}
```

### Step 2: 타입 정의

`src/features/my-feature/types/my-feature.types.ts`:

```typescript
export interface MyFeatureState {
  items: unknown[]
  loading: boolean
  error: string | null
}

export interface FetchItemsRequest {
  limit?: number
  offset?: number
}
```

### Step 3: API 레이어 (데이터 접근)

`src/features/my-feature/api/myFeatureAPI.ts`:

```typescript
import { httpClient } from '@infrastructure/http'
import type { MyFeatureState, FetchItemsRequest } from '../types/my-feature.types'

export const myFeatureAPI = {
  async fetchItems(params?: FetchItemsRequest) {
    const response = await httpClient.get('/api/my-feature/items', { params })
    return response.data as MyFeatureState['items']
  },
  
  async createItem(data: unknown) {
    const response = await httpClient.post('/api/my-feature/items', data)
    return response.data
  },
}
```

**API 테스트** (`src/features/my-feature/api/__tests__/myFeatureAPI.spec.ts`):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myFeatureAPI } from '../myFeatureAPI'

describe('myFeatureAPI', () => {
  beforeEach(() => {
    // Mock 설정
    vi.mock('@infrastructure/http')
  })

  it('should fetch items', async () => {
    const items = await myFeatureAPI.fetchItems()
    expect(items).toBeDefined()
    expect(Array.isArray(items)).toBe(true)
  })
})
```

### Step 4: Services (비즈니스 로직)

`src/features/my-feature/services/myFeatureService.ts`:

```typescript
import { myFeatureAPI } from '../api/myFeatureAPI'
import type { MyFeatureState, FetchItemsRequest } from '../types/my-feature.types'

class MyFeatureService {
  async fetchItems(params?: FetchItemsRequest): Promise<MyFeatureState['items']> {
    // 비즈니스 로직: 검증, 변환, 조합 등
    if (params?.limit && params.limit > 100) {
      throw new Error('Limit cannot exceed 100')
    }
    
    return myFeatureAPI.fetchItems(params)
  }

  async createItem(data: unknown): Promise<unknown> {
    // 비즈니스 로직
    return myFeatureAPI.createItem(data)
  }
}

export const myFeatureService = new MyFeatureService()
```

**Services 테스트** (`src/features/my-feature/services/__tests__/myFeatureService.spec.ts`):

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myFeatureService } from '../myFeatureService'
import * as myFeatureAPI from '../../api/myFeatureAPI'

describe('myFeatureService', () => {
  it('should validate limit parameter', () => {
    expect(() => 
      myFeatureService.fetchItems({ limit: 101 })
    ).rejects.toThrow('Limit cannot exceed 100')
  })

  it('should fetch items', async () => {
    vi.spyOn(myFeatureAPI, 'fetchItems').mockResolvedValue([])
    const items = await myFeatureService.fetchItems()
    expect(items).toEqual([])
  })
})
```

### Step 5: Hooks (React 통합)

`src/features/my-feature/hooks/useMyFeature.ts`:

```typescript
import { useState, useCallback } from 'react'
import { myFeatureService } from '../services/myFeatureService'
import type { MyFeatureState, FetchItemsRequest } from '../types/my-feature.types'

export const useMyFeature = () => {
  const [state, setState] = useState<MyFeatureState>({
    items: [],
    loading: false,
    error: null,
  })

  const fetchItems = useCallback(async (params?: FetchItemsRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const items = await myFeatureService.fetchItems(params)
      setState(prev => ({ ...prev, items, loading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }))
    }
  }, [])

  const createItem = useCallback(async (data: unknown) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const newItem = await myFeatureService.createItem(data)
      setState(prev => ({ 
        ...prev, 
        items: [...prev.items, newItem],
        loading: false 
      }))
      return newItem
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }))
      throw error
    }
  }, [])

  return {
    ...state,
    fetchItems,
    createItem,
  }
}
```

**Hook 테스트** (`src/features/my-feature/hooks/__tests__/useMyFeature.spec.ts`):

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMyFeature } from '../useMyFeature'

describe('useMyFeature', () => {
  it('should fetch items', async () => {
    const { result } = renderHook(() => useMyFeature())

    expect(result.current.loading).toBe(false)

    act(() => {
      result.current.fetchItems()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
```

### Step 6: Components (UI)

`src/features/my-feature/components/MyFeatureList.tsx`:

```typescript
import { useEffect } from 'react'
import { useMyFeature } from '../hooks/useMyFeature'

export const MyFeatureList = () => {
  const { items, loading, error, fetchItems } = useMyFeature()

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Items</h2>
      <ul>
        {items.map((item: any) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

**Component 테스트** (`src/features/my-feature/components/__tests__/MyFeatureList.spec.tsx`):

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyFeatureList } from '../MyFeatureList'

describe('MyFeatureList', () => {
  it('should render list', () => {
    render(<MyFeatureList />)
    expect(screen.getByText('Items')).toBeInTheDocument()
  })
})
```

### Step 7: 공개 API

`src/features/my-feature/index.ts`:

```typescript
// Components
export { MyFeatureList } from './components/MyFeatureList'

// Hooks
export { useMyFeature } from './hooks/useMyFeature'

// Services (필요시)
export { myFeatureService } from './services/myFeatureService'

// Types
export type { MyFeatureState, FetchItemsRequest } from './types/my-feature.types'
```

## 💻 명령어

```bash
# 개발
npm run dev

# 테스트
npm run test              # 테스트 실행
npm run test:ui           # UI 대시보드
npm run test:coverage     # 커버리지 리포트

# 코드 품질
npm run lint              # ESLint 검사
npm run format            # Prettier 포맷팅
npm run type-check        # TypeScript 타입 검사

# 빌드
npm run build
npm run preview
```

## 🧪 테스트 작성 규칙

### 커버리지 목표

| 계층 | 목표 |
|------|------|
| Services | 90%+ |
| Components | 80%+ |
| Hooks | 85%+ |

### 필수 테스트 케이스

- ✅ 정상 동작 케이스
- ✅ 에러 케이스
- ✅ 엣지 케이스 (빈 배열, null, undefined 등)
- ✅ 로딩 상태

## 📝 Git 커밋 메시지 규칙

```
[TYPE](feature-name): 간단한 설명

자세한 설명 (필요시)

관련 이슈: #123
```

**TYPE**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

예시:
```
[feat](auth): add login form with validation

- Add email and password inputs
- Add form validation
- Add error message display

관련 이슈: #42
```

## 🔍 Path Aliases

다음과 같이 import할 수 있습니다:

```typescript
// ✅ Good
import { useAuth } from '@features/auth'
import { Button } from '@shared/components'
import { httpClient } from '@infrastructure/http'

// ❌ Avoid
import { useAuth } from '../../../features/auth'
import { Button } from '../../../../shared/components'
```

## 🚨 주의사항

### ❌ 하지 말 것

```typescript
// 1. Component에서 직접 API 호출
const MyComponent = () => {
  useEffect(() => {
    fetch('/api/data').then(setData)
  }, [])
}

// 2. API 레이어에서 컴포넌트 사용
export const myAPI = {
  render: () => <MyComponent /> // 금지!
}

// 3. 과도한 props drilling
<Feature prop1={prop1} prop2={prop2} prop3={prop3} />
```

### ✅ 해야 할 것

```typescript
// 1. Hook을 통한 데이터 접근
const useData = () => {
  const [data, setData] = useState(null)
  useEffect(() => {
    myFeatureService.getData().then(setData)
  }, [])
  return data
}

// 2. 명확한 계층 분리
// API → Services → Hooks → Components

// 3. Context 또는 Store 사용
// (과도한 props drilling 방지)
```

---

Happy Coding! 🎉
