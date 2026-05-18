# 🛠️ Backend 개발 가이드

> NestJS + Prisma + TypeScript  
> Harness Engineering 기반

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. Prisma 설정
npm run prisma:generate
npm run prisma:db:push

# 3. 개발 서버 시작
npm run start:dev

# 4. Swagger API 문서: http://localhost:3000/api
```

## 📁 프로젝트 구조

```
src/
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
├── repositories/          # GitHub 저장소 모듈
│   ├── dto/
│   ├── repositories.controller.ts
│   ├── repositories.service.ts
│   ├── __tests__/
│   └── __fixtures__/
│
├── analysis/              # 분석 모듈
│   ├── dto/
│   ├── analysis.controller.ts
│   ├── analysis.service.ts
│   ├── utils/
│   ├── __tests__/
│   └── __fixtures__/
│
├── health/                # 헬스 체크 모듈
├── database/              # DB 관련
├── app.module.ts
└── main.ts
```

## 🎯 Module 구조 (Feature-based)

각 Feature 모듈은 다음 구조를 따릅니다:

```
src/my-feature/
├── dto/                   # Data Transfer Objects
│   ├── create-my-feature.dto.ts
│   └── update-my-feature.dto.ts
├── my-feature.controller.ts     # API 엔드포인트
├── my-feature.service.ts        # 비즈니스 로직
├── my-feature.module.ts         # Feature 모듈
├── __tests__/                   # 테스트
│   ├── my-feature.service.spec.ts
│   ├── my-feature.controller.spec.ts
│   └── __fixtures__/
│       └── my-feature.fixtures.ts
└── repository/                  # (선택) Prisma 리포지토리 패턴
    └── my-feature.repository.ts
```

## 🆕 Module 추가 가이드

### Step 1: Module 생성

```bash
nest g module src/my-feature
```

### Step 2: Service 생성

```bash
nest g service src/my-feature/my-feature
```

`src/my-feature/my-feature.service.ts`:

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { CreateMyFeatureDto, UpdateMyFeatureDto } from './dto'

@Injectable()
export class MyFeatureService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMyFeatureDto) {
    return this.prisma.myFeature.create({
      data,
    })
  }

  async findAll() {
    return this.prisma.myFeature.findMany()
  }

  async findOne(id: string) {
    return this.prisma.myFeature.findUnique({
      where: { id },
    })
  }

  async update(id: string, data: UpdateMyFeatureDto) {
    return this.prisma.myFeature.update({
      where: { id },
      data,
    })
  }

  async remove(id: string) {
    return this.prisma.myFeature.delete({
      where: { id },
    })
  }
}
```

**Service 테스트** (`src/my-feature/__tests__/my-feature.service.spec.ts`):

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { MyFeatureService } from '../my-feature.service'
import { PrismaService } from 'src/prisma.service'
import * as fixtures from './__fixtures__/my-feature.fixtures'

describe('MyFeatureService', () => {
  let service: MyFeatureService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyFeatureService,
        {
          provide: PrismaService,
          useValue: {
            myFeature: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<MyFeatureService>(MyFeatureService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a my-feature', async () => {
      jest
        .spyOn(prisma.myFeature, 'create')
        .mockResolvedValue(fixtures.mockMyFeature)

      const result = await service.create(fixtures.createMyFeatureDto)
      expect(result).toEqual(fixtures.mockMyFeature)
      expect(prisma.myFeature.create).toHaveBeenCalledWith({
        data: fixtures.createMyFeatureDto,
      })
    })
  })

  describe('findAll', () => {
    it('should return an array of my-features', async () => {
      jest
        .spyOn(prisma.myFeature, 'findMany')
        .mockResolvedValue([fixtures.mockMyFeature])

      const result = await service.findAll()
      expect(result).toEqual([fixtures.mockMyFeature])
    })
  })
})
```

### Step 3: Controller 생성

```bash
nest g controller src/my-feature/my-feature
```

`src/my-feature/my-feature.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { MyFeatureService } from './my-feature.service'
import { CreateMyFeatureDto, UpdateMyFeatureDto } from './dto'
import { AuthGuard } from 'src/common/guards'

@ApiTags('my-feature')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('my-feature')
export class MyFeatureController {
  constructor(private readonly myFeatureService: MyFeatureService) {}

  @Post()
  create(@Body() createMyFeatureDto: CreateMyFeatureDto) {
    return this.myFeatureService.create(createMyFeatureDto)
  }

  @Get()
  findAll() {
    return this.myFeatureService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.myFeatureService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateMyFeatureDto: UpdateMyFeatureDto,
  ) {
    return this.myFeatureService.update(id, updateMyFeatureDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.myFeatureService.remove(id)
  }
}
```

**Controller 테스트** (`src/my-feature/__tests__/my-feature.controller.spec.ts`):

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { MyFeatureController } from '../my-feature.controller'
import { MyFeatureService } from '../my-feature.service'
import * as fixtures from './__fixtures__/my-feature.fixtures'

describe('MyFeatureController', () => {
  let controller: MyFeatureController
  let service: MyFeatureService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyFeatureController],
      providers: [
        {
          provide: MyFeatureService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<MyFeatureController>(MyFeatureController)
    service = module.get<MyFeatureService>(MyFeatureService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a my-feature', async () => {
      jest
        .spyOn(service, 'create')
        .mockResolvedValue(fixtures.mockMyFeature)

      const result = await controller.create(fixtures.createMyFeatureDto)
      expect(result).toEqual(fixtures.mockMyFeature)
    })
  })
})
```

### Step 4: DTOs 정의

`src/my-feature/dto/create-my-feature.dto.ts`:

```typescript
import { IsString, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateMyFeatureDto {
  @ApiProperty({ description: 'Name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string
}
```

`src/my-feature/dto/update-my-feature.dto.ts`:

```typescript
import { PartialType } from '@nestjs/swagger'
import { CreateMyFeatureDto } from './create-my-feature.dto'

export class UpdateMyFeatureDto extends PartialType(CreateMyFeatureDto) {}
```

### Step 5: Module 설정

`src/my-feature/my-feature.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { MyFeatureService } from './my-feature.service'
import { MyFeatureController } from './my-feature.controller'

@Module({
  controllers: [MyFeatureController],
  providers: [MyFeatureService, PrismaService],
  exports: [MyFeatureService],
})
export class MyFeatureModule {}
```

### Step 6: App Module에 등록

`src/app.module.ts`에 추가:

```typescript
import { MyFeatureModule } from './my-feature/my-feature.module'

@Module({
  imports: [
    MyFeatureModule,
    // ... 다른 모듈들
  ],
})
export class AppModule {}
```

## 💻 명령어

```bash
# 개발
npm run start:dev

# 테스트
npm run test              # 테스트 실행
npm run test:watch       # Watch 모드
npm run test:cov         # 커버리지 리포트

# 빌드
npm run build
npm run start:prod

# 데이터베이스
npm run prisma:generate   # Prisma 클라이언트 생성
npm run prisma:db:push   # DB 마이그레이션
npm run db:init          # DB 초기화
```

## 🧪 테스트 전략

### 테스트 구조

```
__tests__/
├── my-feature.service.spec.ts
├── my-feature.controller.spec.ts
└── __fixtures__/
    └── my-feature.fixtures.ts
```

### Fixtures 예시

`src/my-feature/__tests__/__fixtures__/my-feature.fixtures.ts`:

```typescript
import { CreateMyFeatureDto, UpdateMyFeatureDto } from '../../dto'

export const mockMyFeature = {
  id: '1',
  name: 'Test Feature',
  description: 'Test description',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const createMyFeatureDto: CreateMyFeatureDto = {
  name: 'Test Feature',
  description: 'Test description',
}

export const updateMyFeatureDto: UpdateMyFeatureDto = {
  name: 'Updated Feature',
}
```

### 커버리지 목표

| 계층 | 목표 |
|------|------|
| Services | 90%+ |
| Controllers | 80%+ |

## 📝 Git 커밋 메시지 규칙

```
[TYPE](module-name): 간단한 설명

자세한 설명 (필요시)

관련 이슈: #123
```

**TYPE**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

예시:
```
[feat](auth): add OAuth2 login

- Add OAuth2 service
- Add OAuth2 controller
- Add OAuth2 tests

관련 이슈: #42
```

## 🔑 Best Practices

### 1. 주입 (Dependency Injection)

```typescript
// ✅ Good: 생성자 주입
@Injectable()
export class MyService {
  constructor(
    private prisma: PrismaService,
    private anotherService: AnotherService,
  ) {}
}

// ❌ Bad: 수동 인스턴스화
export class MyService {
  private prisma = new PrismaService()
}
```

### 2. 에러 처리

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common'

export class MyService {
  async findOne(id: string) {
    const item = await this.prisma.myFeature.findUnique({
      where: { id },
    })

    if (!item) {
      throw new NotFoundException('My feature not found')
    }

    return item
  }

  async create(data: CreateMyFeatureDto) {
    if (!data.name) {
      throw new BadRequestException('Name is required')
    }

    return this.prisma.myFeature.create({ data })
  }
}
```

### 3. Validation

```typescript
import { IsString, IsEmail, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string
}
```

## 🚨 주의사항

### ❌ 하지 말 것

```typescript
// 1. Controller에서 직접 DB 접근
@Controller('my-feature')
export class MyFeatureController {
  @Get()
  async findAll() {
    return this.prisma.myFeature.findMany() // 금지!
  }
}

// 2. Service에서 HTTP 응답 생성
export class MyFeatureService {
  async findAll() {
    return {
      statusCode: 200,
      data: [],
    } // 금지! Controller에서 처리
  }
}

// 3. 테스트 없이 배포
```

### ✅ 해야 할 것

```typescript
// 1. Service의 비즈니스 로직 처리
export class MyFeatureService {
  async findAll() {
    return this.prisma.myFeature.findMany()
  }
}

// 2. Controller에서 HTTP 처리
@Controller('my-feature')
export class MyFeatureController {
  constructor(private readonly myFeatureService: MyFeatureService) {}

  @Get()
  async findAll() {
    return this.myFeatureService.findAll()
  }
}

// 3. 항상 테스트 작성
// - Unit tests for services
// - Integration tests for controllers
```

---

Happy Coding! 🎉
