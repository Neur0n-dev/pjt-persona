/**
 * ChatBubble 컴포넌트
 *
 * 토론 대화창에서 각 AI의 발언을 말풍선 형태로 보여주는 컴포넌트야.
 *
 * - 각 페르소나의 색상에 맞는 테두리로 구분
 * - 새 메시지 등장 시 아래에서 위로 페이드인 애니메이션 (Framer Motion)
 * - streaming=true일 때: 텍스트 끝에 커서 깜빡임 표시 (타이핑 중 느낌)
 */
'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { PERSONAS, type PersonaKey } from '@/lib/personas'

interface Props {
  persona: string       // 'A' | 'B' | 'C'
  content: string       // 발언 내용
  turnNumber: number    // 몇 번째 턴인지
  streaming?: boolean   // 현재 스트리밍 중이면 true (커서 표시)
}

// memo: props가 바뀌지 않으면 재렌더 안 함 → 스트리밍 중 완성된 말풍선들 고정
const ChatBubble = memo(function ChatBubble({ persona, content, turnNumber, streaming = false }: Props) {
  const p = PERSONAS[persona as PersonaKey]

  return (
    // 등장 애니메이션: 투명 + 12px 아래 → 불투명 + 원래 위치
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-1"
    >
      {/* 발언자 이름 + 턴 번호 */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${p.textColor}`}>{p.name}</span>
        <span className="text-xs text-gray-300">턴 {turnNumber}</span>
      </div>

      {/* 말풍선 본문 */}
      <div className={`rounded-2xl border bg-gray-700 px-4 py-3 text-sm leading-relaxed text-gray-200 ${p.borderColor}`}>
        {content}

        {/* 스트리밍 중일 때만 깜빡이는 커서 표시 */}
        {streaming && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="ml-0.5 inline-block h-3.5 w-0.5 align-middle bg-gray-400"
          />
        )}
      </div>
    </motion.div>
  )
})

export default ChatBubble
