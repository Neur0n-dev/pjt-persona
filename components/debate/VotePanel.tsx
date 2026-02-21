'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PERSONAS, PERSONA_KEYS, type PersonaKey } from '@/lib/personas'

interface Props {
  debatesUuid: string
}

const barColor: Record<PersonaKey, string> = {
  A: 'bg-violet-500',
  B: 'bg-blue-500',
  C: 'bg-rose-500',
}

const hoverBorder: Record<PersonaKey, string> = {
  A: 'hover:border-violet-500 hover:bg-gray-700',
  B: 'hover:border-blue-500 hover:bg-gray-700',
  C: 'hover:border-rose-500 hover:bg-gray-700',
}

export default function VotePanel({ debatesUuid }: Props) {
  const [myVote, setMyVote] = useState<PersonaKey | null>(null)
  const [votes, setVotes] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = Object.values(votes).reduce((sum, v) => sum + v, 0)

  const maxVotes = Math.max(...PERSONA_KEYS.map((k) => votes[k] ?? 0))
  const winners: PersonaKey[] = myVote
    ? PERSONA_KEYS.filter((k) => (votes[k] ?? 0) === maxVotes)
    : []
  const isTie = winners.length > 1

  const handleVote = async (persona: PersonaKey) => {
    if (myVote || loading) return
    setLoading(true)
    setError('')

    const res = await fetch(`/api/debate/${debatesUuid}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona }),
    })

    const json = await res.json()
    setLoading(false)

    if (!json.result) {
      setError(json.message)
      return
    }

    setMyVote(json.data.myVote)
    setVotes(json.data.votes)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-600 bg-gray-700 p-6">

      {/* 최종 결과 헤더 */}
      {winners.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-xs text-gray-300">{isTie ? '공동 1위' : '최다 득표'}</span>
          <span className="text-lg font-bold text-gray-200">
            {isTie
              ? winners.map((k) => PERSONAS[k].name).join(' · ')
              : `🏆 ${PERSONAS[winners[0]].name}`}
          </span>
        </motion.div>
      ) : (
        <p className="text-center text-sm font-semibold text-gray-300">
          가장 설득력 있었던 AI는?
        </p>
      )}

      <div className="flex flex-col gap-3">
        {PERSONA_KEYS.map((key) => {
          const p = PERSONAS[key]
          const count = votes[key] ?? 0
          const percent = total > 0 ? Math.round((count / total) * 100) : 0
          const isMyVote = myVote === key
          const isWinner = winners.includes(key)

          return (
            <button
              key={key}
              onClick={() => handleVote(key)}
              disabled={!!myVote || loading}
              className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors ${
                isMyVote || isWinner
                  ? `${p.borderColor} bg-gray-700`
                  : myVote
                  ? 'cursor-default border-gray-600'
                  : `border-gray-600 ${hoverBorder[key]}`
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isWinner && !isTie && <span>🏆</span>}
                  <span className={`text-sm font-semibold ${p.textColor}`}>{p.name}</span>
                  {isMyVote && <span className="text-xs text-gray-300">내 투표</span>}
                </div>
                {myVote && (
                  <span className="text-sm font-semibold text-gray-300">{percent}%</span>
                )}
              </div>

              {myVote && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${barColor[key]}`}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {error && <p className="text-center text-xs text-rose-400">{error}</p>}
      {myVote && total > 0 && (
        <p className="text-center text-xs text-gray-300">총 {total}명 투표</p>
      )}
    </div>
  )
}
