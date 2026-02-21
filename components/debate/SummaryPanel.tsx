'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PERSONAS, PERSONA_KEYS, type PersonaKey } from '@/lib/personas'

interface Props {
  debatesUuid: string
}

export default function SummaryPanel({ debatesUuid }: Props) {
  const [summary, setSummary] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/debate/${debatesUuid}/summary`)
        const json = await res.json()
        if (json.result) setSummary(json.data.summary)
        else setError(true)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [debatesUuid])

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-600 bg-gray-700 p-6">
      <p className="text-sm font-semibold text-gray-300">📋 각자의 주장 요약</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-violet-500" />
          요약 생성 중...
        </div>
      ) : error ? (
        <p className="text-sm text-rose-400">요약을 생성하지 못했습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {PERSONA_KEYS.map((key, i) => {
            const p = PERSONAS[key]
            const text = summary?.[p.name]

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`rounded-xl border bg-gray-700 p-3 ${p.borderColor}`}
              >
                <span className={`text-xs font-semibold ${p.textColor}`}>{p.name}</span>
                <p className="mt-1 text-sm leading-relaxed text-gray-300">
                  {text ?? '요약을 가져올 수 없습니다.'}
                </p>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
