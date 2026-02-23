/**
 * 메인 페이지 (/)
 *
 * 사용자가 처음 접하는 화면이야.
 * 여기서 토론 주제를 입력하고 턴 수를 선택한 뒤 토론을 시작할 수 있어.
 *
 * 흐름:
 * 1. 주제 입력 + 턴 수 선택 (6/9/12)
 * 2. '토론 시작' 버튼 클릭
 * 3. POST /api/debate/start 호출 → DB에 토론 생성 + 랜덤 3명 페르소나 선택
 * 4. 입장 알림 화면 표시 ("누구누구누구 입장하였습니다")
 * 5. 생성된 토론 UUID로 /debate/[id] 페이지로 이동
 *
 * 'use client': 버튼 클릭, 입력 상태 관리가 필요해서 클라이언트 컴포넌트로 선언
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_PERSONA_KEYS, PERSONAS } from '@/lib/personas'

const TURN_OPTIONS = [6, 9, 12] as const

interface EntryPersona {
  key: string
  name: string
  title: string
  textColor: string
}

interface EntryInfo {
  debatesUuid: string
  personas: EntryPersona[]
}

export default function Home() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [totalTurns, setTotalTurns] = useState<6 | 9 | 12>(9)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [entryInfo, setEntryInfo] = useState<EntryInfo | null>(null)
  const [visibleCount, setVisibleCount] = useState(0)

  // 입장 알림: 0.5초 간격으로 한 명씩 순차 표시 → 마지막 후 1.5초 뒤 이동
  useEffect(() => {
    if (!entryInfo) return

    if (visibleCount < entryInfo.personas.length) {
      const timer = setTimeout(() => setVisibleCount((v) => v + 1), 500)
      return () => clearTimeout(timer)
    }

    // 3명 다 나온 뒤 1.5초 후 이동
    const nav = setTimeout(() => {
      router.push(`/debate/${entryInfo.debatesUuid}`)
    }, 1500)
    return () => clearTimeout(nav)
  }, [entryInfo, visibleCount, router])

  const handleStart = async () => {
    if (!topic.trim()) {
      setError('토론 주제를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), totalTurns }),
      })

      const json = await res.json()

      if (!json.result) {
        setError(json.message)
        return
      }

      // 입장 알림 시작
      setEntryInfo({ debatesUuid: json.data.debatesUuid, personas: json.data.personas })
      setVisibleCount(0)
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 입장 알림 화면
  if (entryInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-3xl">🎭</span>
            <h2 className="text-xl font-bold text-white">오늘의 토론자</h2>
            <p className="text-sm text-gray-400">{entryInfo.personas.length}명이 선발되었습니다</p>
          </div>

          <div className="flex w-full flex-col gap-3">
            {entryInfo.personas.map((p, i) => (
              <div
                key={p.key}
                className={`flex items-center gap-4 rounded-2xl border border-gray-600 bg-gray-700 px-5 py-4 transition-all duration-500 ${
                  visibleCount > i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <span className={`text-2xl font-bold ${p.textColor}`}>▶</span>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-base font-bold ${p.textColor}`}>{p.name}</span>
                  <span className="text-xs text-gray-400">{p.title}</span>
                </div>
                {visibleCount > i && (
                  <span className="ml-auto text-xs text-gray-400">입장!</span>
                )}
              </div>
            ))}
          </div>

          {visibleCount >= entryInfo.personas.length && (
            <p className="animate-pulse text-sm text-gray-400">토론장으로 이동 중...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
      <div className="flex w-full max-w-xl flex-col gap-8">

        {/* 서비스 타이틀 */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-4xl font-bold text-white">🎭 AI 토론 배틀</h1>
          <p className="text-gray-300">서로 다른 성격의 AI 3명이 자율 토론합니다</p>
        </div>

        {/* 페르소나 풀 소개 */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-600 bg-gray-700/50 p-4">
          <p className="text-center text-sm font-medium text-gray-300">
            아래 <span className="text-violet-400 font-bold">{ALL_PERSONA_KEYS.length}명</span> 중 랜덤 3명이 선발됩니다
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ALL_PERSONA_KEYS.map((key) => {
              const p = PERSONAS[key]
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-1 rounded-xl border bg-gray-700 p-2 ${p.borderColor}`}
                >
                  <span className={`text-xs font-semibold ${p.textColor}`}>{p.name}</span>
                  <span className="text-center text-[10px] text-gray-400">{p.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-600 bg-gray-700 p-6">

          {/* 주제 입력 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">토론 주제</label>
            <textarea
              className="w-full resize-none rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors"
              rows={3}
              placeholder="예) AI가 인간을 대체할 수 있는가"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* 턴 수 선택: 6 / 9 / 12 중 하나 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">턴 수</label>
            <div className="grid grid-cols-3 gap-2">
              {TURN_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTotalTurns(t)}
                  className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${
                    totalTurns === t
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {t}턴
                </button>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="text-sm text-rose-400">{error}</p>}

          {/* 시작 버튼 */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '토론 생성 중...' : '토론 시작'}
          </button>
        </div>
      </div>
    </div>
  )
}
