import { getPrismaMediaRead, getPrismaCoreRead } from "@/shared/lib/prisma";

// Maps table names to the Prisma client that owns them
const tableClientMap: Record<string, () => any> = {
  tbl_posts: getPrismaMediaRead,
  tbl_projects: getPrismaMediaRead,
  tbl_categories: getPrismaMediaRead,
  tbl_tags: getPrismaMediaRead,
};

const tableExistsCache = new Map<string, boolean>();

export async function doesTableExist(tableName: string): Promise<boolean> {
  if (tableExistsCache.has(tableName)) {
    return tableExistsCache.get(tableName)!;
  }

  try {
    const clientGetter = tableClientMap[tableName];
    const client = clientGetter ? clientGetter() : getPrismaCoreRead();

    const result = await client.$queryRaw`
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
    // Fail-open: if we can't check, attempt the query anyway
    tableExistsCache.set(tableName, true);
    return true;
  }
}

export async function safeTableQuery<T>(
  tableName: string,
  queryFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!(await doesTableExist(tableName))) {
    console.warn(`[DBUtils] Table ${tableName} not found, returning fallback`);
    return fallback;
  }

  try {
    return await queryFn();
  } catch (error) {
    console.error(`[DBUtils] Query failed for ${tableName}:`, error);
    return fallback;
  }
}
