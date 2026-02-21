/**
 * Google Gemini AI API 호출 유틸
 *
 * Gemini는 Google이 만든 AI 모델이야.
 * 여기서는 두 가지 방식으로 호출해:
 *
 * 1. generateGemini — 한 번에 전체 응답을 받아옴 (요약 생성에 사용)
 * 2. streamGemini   — 응답을 조각(chunk) 단위로 실시간으로 받아옴 (토론 발언에 사용)
 *
 * 스트리밍을 쓰는 이유:
 * AI가 문장 전체를 다 생성할 때까지 기다리면 사용자가 수초간 아무것도 못 봄.
 * 스트리밍하면 글자가 하나씩 타이핑되듯 보여서 훨씬 자연스러워.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// 단발성 응답 — 프롬프트를 보내고 완성된 텍스트를 한 번에 반환
export const generateGemini = async (prompt: string): Promise<string> => {
  const result = await model.generateContent(prompt)
  return result.response.text()
}

// 스트리밍 응답 — 청크가 올 때마다 onChunk 콜백 호출, 완료 시 전체 텍스트 반환
export const streamGemini = async (
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  const result = await model.generateContentStream(prompt)

  let fullText = ''

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      fullText += text
      onChunk(text) // 청크마다 호출 → 클라이언트에 SSE로 전달됨
    }
  }

  return fullText
}
