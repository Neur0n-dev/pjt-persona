/**
 * POST /api/debate/start
 *
 * 새 토론을 생성하는 API야.
 * 사용자가 메인 페이지에서 주제를 입력하고 '토론 시작'을 누르면 여기로 요청이 와.
 *
 * 흐름:
 * 1. 요청 body에서 topic(주제)과 totalTurns(턴 수) 꺼냄
 * 2. 유효성 검사 (빈 주제, 잘못된 턴 수)
 * 3. DB에 토론 레코드 생성
 * 4. 생성된 토론 UUID 반환 → 프론트에서 /debate/[id]로 이동
 */
import { prisma } from '@/lib/prisma'
import { PERSONA_KEYS } from '@/lib/personas'

const VALID_TURNS = [6, 9, 12]

export async function POST(req: Request) {
  const body = await req.json()
  const { topic, totalTurns } = body

  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    return Response.json({ result: false, message: '토론 주제를 입력해주세요.' }, { status: 400 })
  }

  if (!VALID_TURNS.includes(totalTurns)) {
    return Response.json({ result: false, message: '턴 수는 6, 9, 12 중 하나여야 합니다.' }, { status: 400 })
  }

  // 페르소나 3명은 항상 A → B → C 고정 순서
  console.log('[debate/start] personas:', PERSONA_KEYS)

  const debate = await prisma.debate.create({
    data: {
      debatesUuid: crypto.randomUUID(),
      debatesTopic: topic.trim(),
      debatesStatus: 'ongoing', // 생성 즉시 진행 중 상태
      debatesTotalTurns: totalTurns,
    },
  })

  return Response.json({
    result: true,
    data: {
      debatesUuid: debate.debatesUuid,
      topic: debate.debatesTopic,
      totalTurns: debate.debatesTotalTurns,
    },
  })
}
