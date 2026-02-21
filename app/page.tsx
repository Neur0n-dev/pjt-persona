/**
 * 메인 페이지 (/)
 *
 * 사용자가 처음 접하는 화면이야.
 * 여기서 토론 주제를 입력하고 턴 수를 선택한 뒤 토론을 시작할 수 있어.
 *
 * 흐름:
 * 1. 주제 입력 + 턴 수 선택 (6/9/12)
 * 2. '토론 시작' 버튼 클릭
 * 3. POST /api/debate/start 호출 → DB에 토론 생성
 * 4. 생성된 토론 UUID로 /debate/[id] 페이지로 이동
 *
 * 'use client': 버튼 클릭, 입력 상태 관리가 필요해서 클라이언트 컴포넌트로 선언
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TURN_OPTIONS = [6, 9, 12] as const

export default function Home() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [totalTurns, setTotalTurns] = useState<6 | 9 | 12>(9)  // 기본값 9턴
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      // 토론 생성 성공 → 관전 페이지로 이동
      router.push(`/debate/${json.data.debatesUuid}`)
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
      <div className="flex w-full max-w-xl flex-col gap-8">

        {/* 서비스 타이틀 */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-4xl font-bold text-white">🎭 AI 토론 배틀</h1>
          <p className="text-gray-300">서로 다른 성격의 AI 3명이 자율 토론합니다</p>
        </div>

        {/* 페르소나 3인 소개 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '자칭 논리왕', desc: '냉철한 분석가', color: 'border-violet-500 text-violet-400' },
            { label: '나..안운다', desc: '따뜻한 공감러', color: 'border-blue-500 text-blue-400' },
            { label: '입만살았음', desc: '직설적 반골', color: 'border-rose-500 text-rose-400' },
          ].map((p) => (
            <div key={p.label} className={`flex flex-col items-center gap-1 rounded-xl border bg-gray-700 p-3 ${p.color}`}>
              <span className={`text-sm font-semibold ${p.color.split(' ')[1]}`}>{p.label}</span>
              <span className="text-xs text-gray-300">{p.desc}</span>
            </div>
          ))}
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
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'  // 선택된 턴
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

          {/* 시작 버튼: 로딩 중엔 비활성화 */}
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
