/**
 * useDebate 훅
 *
 * 관전 페이지의 핵심 로직을 담당하는 커스텀 훅이야.
 * 훅(Hook)이란 React 컴포넌트에서 상태나 사이드 이펙트를 관리하는 함수야.
 *
 * 이 훅이 하는 일:
 * 1. 토론 초기 데이터 불러오기 (GET /api/debate/[id])
 * 2. 자동으로 다음 턴 요청 (POST /api/debate/[id]/next)
 * 3. SSE 스트리밍 수신 → 화면에 실시간 타이핑 효과 표시
 * 4. 턴 완료 시 메시지 목록에 추가 → 다시 다음 턴 트리거
 * 5. 모든 턴 완료 시 자동 중지
 * 6. 페이지 이탈 시 진행 중 스트리밍 취소
 *
 * 반환값:
 * - debate: 토론 전체 상태 (주제, 메시지 목록, 현재 턴 등)
 * - streamingText: 현재 스트리밍 중인 텍스트 (타이핑 효과용)
 * - streamingPersona: 현재 발언 중인 페르소나 키 (A/B/C)
 * - isStreaming: 스트리밍 진행 여부
 * - error: 에러 메시지
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type PersonaKey } from '@/lib/personas'

// requestAnimationFrame으로 텍스트 업데이트를 프레임당 1회로 묶음
function useRafState<T>(initial: T) {
  const [state, setState] = useState<T>(initial)
  const rafRef = useRef<number | null>(null)
  const pendingRef = useRef<T>(initial)

  const setRafState = useCallback((value: T) => {
    pendingRef.current = value
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      setState(pendingRef.current)
      rafRef.current = null
    })
  }, [])

  const reset = useCallback((value: T) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingRef.current = value
    setState(value)
  }, [])

  return [state, setRafState, reset] as const
}

// 개별 발언 메시지 타입
export interface Message {
  uuid: string
  persona: string       // 'A' | 'B' | 'C'
  content: string       // 발언 내용
  turnNumber: number    // 몇 번째 턴인지
  streaming?: boolean   // 현재 스트리밍 중인 메시지인지 (임시 표시용)
}

// 토론 전체 상태 타입
export interface DebateState {
  debatesUuid: string
  topic: string
  status: string         // 'ongoing' | 'completed'
  totalTurns: number     // 설정된 총 턴 수 (6/9/12)
  personas: string[]     // 이 토론에 배정된 3명의 PersonaKey 배열 (e.g. ['A', 'D', 'G'])
  currentTurn: number    // 현재까지 완료된 턴 수
  messages: Message[]    // 지금까지의 모든 발언
}

interface UseDebateReturn {
  debate: DebateState | null
  streamingText: string
  streamingPersona: string | null
  isStreaming: boolean
  error: string | null
}

export default function useDebate(id: string): UseDebateReturn {
  const [debate, setDebate] = useState<DebateState | null>(null)
  const [streamingText, setStreamingText, resetStreamingText] = useRafState('')  // 실시간 타이핑 텍스트
  const [streamingPersona, setStreamingPersona] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)  // 스트리밍 취소용
  const isRunning = useRef(false)                         // 중복 요청 방지용

  // 다음 턴 AI 발언 요청 및 SSE 수신
  const triggerNext = useCallback(async (currentDebate: DebateState) => {
    // 이미 실행 중이거나, 토론이 끝났거나, 턴이 다 찼으면 실행 안 함
    if (isRunning.current) return
    if (currentDebate.status !== 'ongoing') return
    if (currentDebate.currentTurn >= currentDebate.totalTurns) return

    isRunning.current = true
    abortRef.current = new AbortController()

    // 이 토론에 배정된 3명 중 순환 결정
    const personaKey: PersonaKey = currentDebate.personas[currentDebate.currentTurn % 3] as PersonaKey

    try {
      const res = await fetch(`/api/debate/${id}/next`, {
        method: 'POST',
        signal: abortRef.current.signal, // 취소 가능하도록 signal 연결
      })

      if (!res.ok || !res.body) throw new Error('스트리밍 응답 실패')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''       // 미처리 데이터 버퍼 (줄 단위로 처리하기 위해)
      let accumulated = ''  // 지금까지 받은 전체 텍스트

      // 스트리밍 시작 — 페르소나 카드 '발언 중' 표시
      setIsStreaming(true)
      setStreamingPersona(personaKey)
      resetStreamingText('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // 바이트 → 문자열 변환 (stream: true = 멀티바이트 문자 안전 처리)
        buffer += decoder.decode(value, { stream: true })

        // SSE는 "\n\n"으로 이벤트 구분, 줄 단위로 파싱
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // 마지막 미완성 줄은 다음 청크와 합침

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6)) // "data: " 접두사 제거 후 파싱

          if (data.type === 'chunk') {
            // 텍스트 조각 수신 → 화면에 실시간 표시
            accumulated += data.content
            setStreamingText(accumulated)
          } else if (data.type === 'done') {
            // 발언 완료 → 메시지 목록에 추가, 스트리밍 상태 초기화
            setDebate((prev) => {
              if (!prev) return prev
              const newMessage: Message = {
                uuid: crypto.randomUUID(),
                persona: data.persona,
                content: accumulated,
                turnNumber: data.turnNumber,
              }
              return {
                ...prev,
                currentTurn: data.turnNumber,
                status: data.isLastTurn ? 'completed' : 'ongoing',
                messages: [...prev.messages, newMessage],
              }
            })

            resetStreamingText('')
            setStreamingPersona(null)
            setIsStreaming(false)
            isRunning.current = false
            // debate 상태가 바뀌면 아래 useEffect가 다시 triggerNext를 호출함
          } else if (data.type === 'error') {
            throw new Error(data.message)
          }
        }
      }
    } catch (err) {
      // AbortError는 페이지 이탈로 인한 의도적 취소 → 무시
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      setIsStreaming(false)
      isRunning.current = false
    }
  }, [id])

  // 1. 최초 마운트 시 토론 데이터 불러오기
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/debate/${id}`)
      const json = await res.json()

      if (!json.result) {
        setError(json.message)
        return
      }

      setDebate(json.data) // 데이터 세팅 → 아래 useEffect 트리거
    }
    load()
  }, [id])

  // 2. 턴이 완료될 때마다 자동으로 다음 턴 요청
  // debate.currentTurn 또는 debate.status 바뀔 때마다 실행됨
  useEffect(() => {
    if (!debate) return
    if (isRunning.current) return
    triggerNext(debate)
  }, [debate?.currentTurn, debate?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // 3. 페이지 이탈 시 진행 중인 스트리밍 취소 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return { debate, streamingText, streamingPersona, isStreaming, error }
}
