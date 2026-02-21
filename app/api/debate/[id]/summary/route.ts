/**
 * GET /api/debate/[id]/summary
 *
 * 토론이 끝난 후 각 페르소나의 주장을 요약해주는 API야.
 * SummaryPanel 컴포넌트가 토론 종료 시 자동으로 호출해.
 *
 * 흐름:
 * 1. 토론 + 전체 메시지 조회
 * 2. 완료 상태인지 확인
 * 3. 전체 대화 내용을 텍스트로 합쳐서 Gemini에게 요약 요청
 * 4. Gemini가 JSON 형식으로 페르소나별 요약 반환
 * 5. JSON 파싱 후 클라이언트에 전달
 *
 * Gemini에게 JSON만 뽑아달라고 요청하는 이유:
 * 자유 형식으로 요청하면 "네, 요약해드릴게요." 같은 말이 붙어서
 * JSON 파싱이 깨질 수 있어. 그래서 코드블록 제거 처리도 포함됨.
 */
import { prisma } from '@/lib/prisma'
import { generateGemini } from '@/lib/gemini'
import { PERSONAS, type PersonaKey } from '@/lib/personas'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const debate = await prisma.debate.findUnique({
    where: { debatesUuid: id },
    include: {
      messages: {
        orderBy: { messageTurnNumber: 'asc' },
        select: { messagePersona: true, messageContent: true },
      },
    },
  })

  if (!debate) {
    return Response.json({ result: false, message: '토론을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (debate.debatesStatus !== 'completed') {
    return Response.json({ result: false, message: '토론이 아직 진행 중입니다.' }, { status: 400 })
  }

  // 전체 대화를 "이름: 내용" 형식의 텍스트로 변환
  const historyText = debate.messages
    .map((m) => `${PERSONAS[m.messagePersona as PersonaKey].name}: ${m.messageContent}`)
    .join('\n\n')

  const prompt = `다음은 "${debate.debatesTopic}" 주제로 진행된 AI 토론이야.

${historyText}

위 토론에서 각 참여자가 주장한 핵심 내용을 아래 JSON 형식으로 요약해줘.
각 요약은 2~3문장, 반말로 작성해.

{
  "자칭 논리왕": "...",
  "나..안운다": "...",
  "입만살았음": "..."
}

JSON만 출력하고 다른 텍스트는 절대 포함하지 마.`

  const raw = await generateGemini(prompt)

  // Gemini가 ```json ... ``` 코드블록으로 감쌀 수 있어서 제거 후 파싱
  const json = raw.replace(/```json|```/g, '').trim()
  const summary = JSON.parse(json)

  return Response.json({ result: true, data: { summary } })
}
