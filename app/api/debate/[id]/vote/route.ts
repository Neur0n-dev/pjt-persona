/**
 * POST /api/debate/[id]/vote
 *
 * 투표 API야. IP 기반으로 중복 투표를 막아.
 *
 * 흐름:
 * 1. 요청 body에서 투표할 페르소나(A/B/C) 꺼냄
 * 2. 요청자 IP 추출 (프록시 환경도 고려)
 * 3. 토론이 완료 상태인지 확인 (진행 중엔 투표 불가)
 * 4. 같은 IP가 이미 투표했는지 확인
 * 5. 투표 저장 후 전체 집계 결과 반환
 *
 * IP 추출 우선순위:
 * x-forwarded-for (nginx 등 프록시) → x-real-ip → 'unknown'
 */
import { prisma } from '@/lib/prisma'
import { PERSONA_KEYS, type PersonaKey } from '@/lib/personas'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()
  const { persona } = body

  // A, B, C 외 다른 값이 오면 거부
  if (!PERSONA_KEYS.includes(persona)) {
    return Response.json({ result: false, message: '유효하지 않은 페르소나입니다.' }, { status: 400 })
  }

  // 프록시를 거치는 경우 x-forwarded-for에 실제 IP가 들어있음 (콤마로 여러 개일 수 있어서 첫 번째만 사용)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const debate = await prisma.debate.findUnique({
    where: { debatesUuid: id },
    select: { debatesStatus: true },
  })

  if (!debate) {
    return Response.json({ result: false, message: '토론을 찾을 수 없습니다.' }, { status: 404 })
  }

  // 토론이 끝나야만 투표 가능
  if (debate.debatesStatus !== 'completed') {
    return Response.json({ result: false, message: '토론이 종료된 후에 투표할 수 있습니다.' }, { status: 400 })
  }

  // 같은 IP + 같은 토론에 이미 투표한 기록이 있으면 거부 (unique_debate_voter 유니크 제약)
  const existing = await prisma.vote.findUnique({
    where: { unique_debate_voter: { debatesUuid: id, votesIp: ip } },
  })

  if (existing) {
    return Response.json({ result: false, message: '이미 투표하셨습니다.' }, { status: 409 })
  }

  await prisma.vote.create({
    data: {
      votesUuid: crypto.randomUUID(),
      debatesUuid: id,
      votesPersona: persona as PersonaKey,
      votesIp: ip,
    },
  })

  // 투표 후 A/B/C 각각의 득표 수 집계해서 반환
  const votes = await prisma.vote.groupBy({
    by: ['votesPersona'],
    where: { debatesUuid: id },
    _count: true,
  })

  const result = Object.fromEntries(
    PERSONA_KEYS.map((key) => [
      key,
      votes.find((v) => v.votesPersona === key)?._count ?? 0,
    ])
  )

  return Response.json({ result: true, data: { votes: result, myVote: persona } })
}
