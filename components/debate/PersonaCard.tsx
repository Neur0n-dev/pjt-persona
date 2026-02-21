/**
 * PersonaCard 컴포넌트
 *
 * 토론 상단에 고정되어 있는 AI 페르소나 3개의 명함 카드야.
 * 현재 발언 중인 페르소나의 카드가 살짝 확대되고 "발언 중" 텍스트가 깜빡여.
 *
 * isSpeaking = true일 때:
 * - 카드 테두리가 페르소나 색상으로 강조
 * - 카드 크기 1.03배 확대 애니메이션
 * - "발언 중" 텍스트 반복 페이드 애니메이션
 */
'use client'

import { motion } from 'framer-motion'
import { PERSONAS, type PersonaKey } from '@/lib/personas'

interface Props {
  personaKey: PersonaKey  // 'A' | 'B' | 'C'
  isSpeaking: boolean     // 현재 이 페르소나가 발언 중인지
}

export default function PersonaCard({ personaKey, isSpeaking }: Props) {
  const p = PERSONAS[personaKey]

  return (
    // 발언 중이면 1.03배 확대, 아니면 원래 크기
    <motion.div
      animate={isSpeaking ? { scale: 1.03 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col gap-1.5 rounded-2xl border bg-gray-700 p-4 transition-colors ${
        isSpeaking ? `${p.borderColor} bg-gray-700` : 'border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* 페르소나 이름 (색상은 각자 다름) */}
        <span className={`text-sm font-bold ${p.textColor}`}>{p.name}</span>

        {/* 발언 중일 때만 표시되는 깜빡이는 인디케이터 */}
        {isSpeaking && (
          <motion.span
            animate={{ opacity: [1, 0.3] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className={`text-xs font-medium ${p.textColor}`}
          >
            발언 중
          </motion.span>
        )}
      </div>
      <span className="text-xs text-gray-300">{p.title}</span>
      <span className="text-xs text-gray-300">{p.description}</span>
    </motion.div>
  )
}
