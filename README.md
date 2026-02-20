# 🎭 Persona

서로 다른 성격의 AI 3인이 자율 토론하는 관전형 엔터테인먼트 플랫폼

## 개요

다양한 페르소나를 가진 AI 캐릭터들이 주어진 주제에 대해 자율적으로 토론하고, 사용자는 이를 실시간으로 관전·투표하는 엔터테인먼트 서비스입니다.

## 핵심 컨셉

- **자율 토론** — AI 3인이 사용자 개입 없이 독립적으로 논쟁을 전개
- **다양한 페르소나** — 각기 다른 성격, 말투, 가치관을 가진 고정 참가자 3인
- **관전 경험** — 사용자는 토론을 지켜보며 투표로 승자를 결정
- **실시간 스트리밍** — Gemini API 스트리밍 + 타이핑 애니메이션

## 기술 스택

**Frontend**
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — 스타일링
- Framer Motion — 타이핑 애니메이션

**Backend**
- Next.js API Routes
- Google Gemini API — 페르소나 발언 생성 (스트리밍)
- Prisma ORM + MySQL

**인프라**
- GitHub Actions — 자동 배포
- PM2 — 프로세스 관리
- 서비스 URL: https://persona.neurondev.co.kr

## 프로젝트 구조

```
app/
├── page.tsx                     # 메인 (주제 입력, 턴 수 선택)
├── api/debate/
│   ├── start/route.ts           # POST — 토론 생성, 페르소나 3인 배정
│   └── [id]/
│       ├── route.ts             # GET  — 토론 + 메시지 조회
│       ├── next/route.ts        # POST — 다음 턴 Gemini 스트리밍 호출
│       └── vote/route.ts        # POST — IP 기반 투표
└── debate/[id]/
    ├── page.tsx                 # 관전 페이지
    ├── loading.tsx
    └── error.tsx

components/
├── debate/
│   ├── DebateArena.tsx          # 전체 토론 레이아웃 (3인 배치)
│   ├── PersonaCard.tsx          # 페르소나 카드
│   └── ChatBubble.tsx           # 말풍선 (타이핑 애니메이션)
└── ui/

hooks/
└── useDebate.ts                 # SSE 스트리밍 수신 + 자동 다음 턴 트리거

lib/
├── prisma.ts                    # Prisma Client 싱글톤
├── gemini.ts                    # Gemini 스트리밍 API 호출
└── personas.ts                  # 페르소나 3종 프롬프트 정의

prisma/
└── schema.prisma                # DB 스키마

sql/schema/
├── 01_create_tables.sql
├── 02_indexes.sql
└── 03_constraints.sql
```

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/debate/start` | 토론 생성 (주제, 턴 수) |
| GET  | `/api/debate/:id` | 토론 + 메시지 전체 조회 |
| POST | `/api/debate/:id/next` | 다음 턴 Gemini 스트리밍 호출 |
| POST | `/api/debate/:id/vote` | IP 기반 투표 (중복 방지) |

## DB 테이블

| 테이블 | 설명 |
|--------|------|
| `t_persona_debates` | 토론 (uuid, topic, status, 턴수) |
| `t_persona_message` | 발언 (debates_uuid, persona, content, turn_number) |
| `t_persona_votes` | 투표 (debates_uuid, persona, ip) — IP당 1표 |

## 환경변수

```
DATABASE_URL="mysql://user:password@host:3306/dbname"
GEMINI_API_KEY="..."
```

## 실행

```bash
npm run build    # 프로덕션 빌드
npm start        # 서버 실행 (포트 3020)
```
