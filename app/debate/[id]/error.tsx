'use client'

import { useRouter } from 'next/navigation'

interface Props {
  error: Error
}

export default function ErrorPage({ error }: Props) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-700">
      <p className="text-rose-400">{error.message || '토론을 불러올 수 없습니다.'}</p>
      <button
        onClick={() => router.push('/')}
        className="rounded-xl border border-gray-600 px-5 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-gray-200 transition-colors"
      >
        메인으로 돌아가기
      </button>
    </div>
  )
}
