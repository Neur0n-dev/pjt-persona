'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type PersonaKey } from '@/lib/personas'
import PersonaCard from './PersonaCard'
import ChatBubble from './ChatBubble'
import SummaryPanel from './SummaryPanel'
import VotePanel from './VotePanel'
import type { DebateState, Message } from '@/hooks/useDebate'

interface Props {
  debate: DebateState
  streamingText: string
  streamingPersona: string | null
  isStreaming: boolean
}

export default function DebateArena({ debate, streamingText, streamingPersona, isStreaming }: Props) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [debate.messages.length, streamingText])

  // 완성된 메시지는 memoize → streamingText가 바뀌어도 이 목록은 재렌더 안 됨
  const completedMessages = useMemo(() => debate.messages, [debate.messages])

  return (
    <div className="flex flex-col gap-6">

      {/* 상태 바 */}
      <div className="flex items-center justify-between rounded-xl border border-gray-600 bg-gray-700 px-5 py-4">
        <span className="truncate text-base font-medium text-gray-200">{debate.topic}</span>
        <span className="shrink-0 pl-4 text-sm text-gray-300">
          {debate.currentTurn} / {debate.totalTurns} 턴
        </span>
      </div>

      {/* 페르소나 카드 3인 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {debate.personas.map((key) => (
          <PersonaCard
            key={key}
            personaKey={key as PersonaKey}
            isSpeaking={isStreaming && streamingPersona === key}
          />
        ))}
      </div>

      {/* 대화 피드 */}
      <div className="flex flex-col gap-4">
        {completedMessages.length === 0 && !streamingPersona && (
          <p className="text-center text-sm text-gray-300">토론을 시작하고 있습니다...</p>
        )}
        {/* 완성된 메시지 — memoized, 스트리밍 중 재렌더 없음 */}
        {completedMessages.map((m) => (
          <ChatBubble
            key={m.uuid}
            persona={m.persona}
            content={m.content}
            turnNumber={m.turnNumber}
          />
        ))}
        {/* 스트리밍 중인 말풍선 — streamingText만 별도 업데이트 */}
        {streamingPersona && (
          <ChatBubble
            key="streaming"
            persona={streamingPersona}
            content={streamingText}
            turnNumber={debate.currentTurn + 1}
            streaming
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* 토론 종료 + 요약 + 투표 */}
      {debate.status === 'completed' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-600 bg-gray-700 py-6">
            <span className="text-sm text-gray-300">토론이 종료되었습니다</span>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="rounded-xl border border-gray-600 px-5 py-2 text-sm text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
              >
                ← 새 토론 시작
              </button>
              <button
                onClick={handleCopy}
                className="rounded-xl border border-gray-600 px-5 py-2 text-sm text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
              >
                {copied ? '✓ 복사됨' : '🔗 링크 복사'}
              </button>
            </div>
          </div>
          <SummaryPanel debatesUuid={debate.debatesUuid} personas={debate.personas} />
          <VotePanel debatesUuid={debate.debatesUuid} personas={debate.personas} />
        </div>
      )}
    </div>
  )
}
