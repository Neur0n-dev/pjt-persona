/**
 * GET /api/debate/[id]
 *
 * 특정 토론의 전체 정보를 조회하는 API야.
 * 관전 페이지 진입 시 처음 한 번 호출돼서 기존 메시지를 모두 불러와.
 *
 * 반환 데이터:
 * - 토론 기본 정보 (주제, 상태, 총 턴 수, 현재 턴)
 * - 지금까지 저장된 모든 메시지 (턴 번호 오름차순)
 *
 * currentTurn = messages.length 로 계산됨
 * → 프론트에서 다음에 누가 발언할지 판단하는 데 사용
 */
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const debate = await prisma.debate.findUnique({
    where: { debatesUuid: id },
    include: {
      messages: {
        orderBy: { messageTurnNumber: 'asc' }, // 턴 순서대로 정렬
        select: {
          messageUuid: true,
          messagePersona: true,
          messageContent: true,
          messageTurnNumber: true,
          createdDate: true,
        },
      },
    },
  })

  if (!debate) {
    return Response.json({ result: false, message: '토론을 찾을 수 없습니다.' }, { status: 404 })
  }

  return Response.json({
    result: true,
    data: {
      debatesUuid: debate.debatesUuid,
      topic: debate.debatesTopic,
      status: debate.debatesStatus,
      totalTurns: debate.debatesTotalTurns,
      currentTurn: debate.messages.length, // 저장된 메시지 수 = 완료된 턴 수
      createdDate: debate.createdDate,
      messages: debate.messages.map((m) => ({
        uuid: m.messageUuid,
        persona: m.messagePersona,
        content: m.messageContent,
        turnNumber: m.messageTurnNumber,
        createdDate: m.createdDate,
      })),
    },
  })
}
