/**
 * 토론 관전 페이지 (/debate/[id])
 *
 * 실제 토론이 진행되는 화면이야.
 * URL의 [id] 부분이 토론 UUID가 되고, 이걸로 DB에서 데이터를 가져와.
 *
 * 흐름:
 * 1. useDebate 훅이 자동으로 토론 데이터 불러오기 + 다음 턴 AI 호출 반복
 * 2. 스트리밍 텍스트 / 발언 중인 페르소나 / 완료 메시지 등을 DebateArena에 전달
 * 3. 에러 발생 시 throw → Next.js가 error.tsx를 자동으로 보여줌
 * 4. 데이터 로딩 중엔 스피너 표시
 *
 * 'use client': useDebate 훅이 브라우저 API(fetch, EventSource 등)를 사용하므로 필수
 */
'use client'

import { use } from 'react'
import useDebate from '@/hooks/useDebate'
import DebateArena from '@/components/debate/DebateArena'

interface Props {
  params: Promise<{ id: string }>
}

export default function DebatePage({ params }: Props) {
  // Next.js 15+에서 params가 Promise로 변경됨 → use()로 언래핑
  const { id } = use(params)
  const { debate, streamingText, streamingPersona, isStreaming, error } = useDebate(id)

  // 에러는 throw하면 Next.js가 error.tsx를 자동으로 렌더링함
  if (error) throw new Error(error)

  // 초기 데이터 로딩 중 (API 응답 전)
  if (!debate) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-700">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-violet-500" />
        <p className="text-sm text-gray-300">토론을 불러오는 중...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <DebateArena
          debate={debate}
          streamingText={streamingText}
          streamingPersona={streamingPersona}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  )
}
