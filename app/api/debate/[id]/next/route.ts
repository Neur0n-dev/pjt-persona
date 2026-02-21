/**
 * POST /api/debate/[id]/next
 *
 * 다음 턴의 AI 발언을 생성하는 API야. 이 프로젝트의 핵심 엔드포인트.
 *
 * 흐름:
 * 1. 토론 상태 검증 (존재하는지, ongoing인지, 턴 초과 아닌지)
 * 2. 현재까지의 메시지 수로 다음 발언자(페르소나 A/B/C) 결정
 * 3. 지금까지의 대화 내용 + 페르소나 성격을 합쳐서 Gemini에게 프롬프트 전달
 * 4. Gemini 응답을 SSE(Server-Sent Events)로 실시간 스트리밍
 * 5. 스트리밍 완료 후 DB에 메시지 저장
 * 6. 마지막 턴이면 토론 상태를 'completed'로 변경
 *
 * SSE 이벤트 종류:
 * - { type: 'chunk', content: '...' }  → 텍스트 조각 (타이핑 효과)
 * - { type: 'done', turnNumber, persona, isLastTurn }  → 완료 신호
 * - { type: 'error', message: '...' }  → 에러 발생
 */
import { prisma } from '@/lib/prisma'
import { PERSONA_KEYS, buildPrompt, type PersonaKey } from '@/lib/personas'
import { streamGemini } from '@/lib/gemini'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const debate = await prisma.debate.findUnique({
    where: { debatesUuid: id },
    include: {
      messages: {
        orderBy: { messageTurnNumber: 'asc' },
        select: {
          messagePersona: true,
          messageContent: true,
        },
      },
    },
  })

  if (!debate) {
    return Response.json({ result: false, message: '토론을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (debate.debatesStatus !== 'ongoing') {
    return Response.json({ result: false, message: '이미 종료된 토론입니다.' }, { status: 400 })
  }

  const currentTurn = debate.messages.length

  if (currentTurn >= debate.debatesTotalTurns) {
    return Response.json({ result: false, message: '모든 턴이 완료되었습니다.' }, { status: 400 })
  }

  // 턴 수 % 3 으로 A → B → C → A → B → C ... 순환
  const personaKey: PersonaKey = PERSONA_KEYS[currentTurn % 3]
  const turnNumber = currentTurn + 1
  const isLastTurn = turnNumber >= debate.debatesTotalTurns

  // 이전 대화 내용을 히스토리 형태로 변환
  const history = debate.messages.map((m) => ({
    persona: m.messagePersona as PersonaKey,
    content: m.messageContent,
  }))

  // 페르소나 성격 + 대화 히스토리를 합쳐 Gemini 프롬프트 생성
  const prompt = buildPrompt(personaKey, debate.debatesTopic, history)

  const encoder = new TextEncoder()

  // ReadableStream: Node.js에서 SSE를 구현하는 방식
  // controller.enqueue()로 데이터를 밀어넣으면 클라이언트가 실시간으로 수신함
  const stream = new ReadableStream({
    async start(controller) {
      // SSE 형식: "data: {...}\n\n"
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const fullText = await streamGemini(prompt, (chunk) => {
          send({ type: 'chunk', content: chunk }) // 청크마다 클라이언트로 전송
        })

        // 스트리밍 완료 후 전체 텍스트를 DB에 저장
        await prisma.message.create({
          data: {
            messageUuid: crypto.randomUUID(),
            debatesUuid: id,
            messagePersona: personaKey,
            messageContent: fullText,
            messageTurnNumber: turnNumber,
          },
        })

        // 마지막 턴이면 토론 종료 처리
        if (isLastTurn) {
          await prisma.debate.update({
            where: { debatesUuid: id },
            data: { debatesStatus: 'completed' },
          })
        }

        send({ type: 'done', turnNumber, persona: personaKey, isLastTurn })
      } catch (err) {
        console.error('[debate/next] error:', err)
        send({ type: 'error', message: 'AI 응답 중 오류가 발생했습니다.' })
      } finally {
        controller.close() // 스트림 종료
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream', // SSE 응답임을 브라우저에 알림
      'Cache-Control': 'no-cache',         // 캐싱 금지 (실시간 데이터니까)
      Connection: 'keep-alive',            // 연결 유지
    },
  })
}
