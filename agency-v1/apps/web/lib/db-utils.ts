import { prisma } from "@/lib/prisma";

const tableExistsCache = new Map<string, boolean>();

export async function doesTableExist(tableName: string): Promise<boolean> {
  if (tableExistsCache.has(tableName)) {
    return tableExistsCache.get(tableName)!;
  }

  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${tableName}
      ) AS "exists"
    `;

    const exists = Array.isArray(result)
      ? (result[0] as any)?.exists
      : (result as any)?.exists;

    const boolExists = !!exists;
    tableExistsCache.set(tableName, boolExists);
    return boolExists;
  } catch (error) {
    console.error(`[DBUtils] Table existence check failed for ${tableName}:`, error);
    tableExistsCache.set(tableName, false);
    return false;
  }
}

export async function safeTableQuery<T>(
  tableName: string,
  queryFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!(await doesTableExist(tableName))) {
    return fallback;
  }

  try {
    return await queryFn();
  } catch (error) {
    console.error(`[DBUtils] Query failed for ${tableName}:`, error);
    return fallback;
  }
}
