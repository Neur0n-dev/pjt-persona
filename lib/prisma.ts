/**
 * Prisma 클라이언트 싱글톤
 *
 * Prisma는 DB와 통신하는 ORM(Object Relational Mapper)이야.
 * 쉽게 말하면 SQL을 직접 안 쓰고 JS 코드로 DB 조회/저장을 할 수 있게 해주는 도구.
 *
 * 싱글톤으로 만드는 이유:
 * Next.js 개발 서버는 파일 변경 시 모듈을 다시 불러오는데,
 * 그때마다 새 DB 연결을 만들면 연결이 너무 많이 생겨서 에러가 남.
 * globalThis에 저장해두면 이미 만든 연결을 재사용할 수 있어.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

// 개발 환경에서만 전역에 저장 (프로덕션은 요청마다 새 인스턴스가 안전함)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
