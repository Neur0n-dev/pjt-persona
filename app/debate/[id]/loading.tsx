export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-700">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-violet-500" />
        <p className="text-sm text-gray-300">토론을 불러오는 중...</p>
      </div>
    </div>
  )
}
