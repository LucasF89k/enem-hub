import { openDB, type IDBPDatabase } from "idb"

interface QueueItem {
  id?: number
  type: "answerQuestion" | "saveFlashcard" | "saveStudySession"
  payload: Record<string, unknown>
  createdAt: number
  retries: number
}

interface EnemHubDB {
  offlineQueue: {
    key: number
    value: QueueItem
    indexes: { "by-type": string }
  }
}

let _db: IDBPDatabase<EnemHubDB> | null = null

async function getDB(): Promise<IDBPDatabase<EnemHubDB>> {
  if (_db) return _db
  _db = await openDB<EnemHubDB>("enem-hub", 1, {
    upgrade(db) {
      const store = db.createObjectStore("offlineQueue", {
        keyPath: "id",
        autoIncrement: true,
      })
      store.createIndex("by-type", "type")
    },
  })
  return _db
}

export async function enqueueOfflineAction(
  type: QueueItem["type"],
  payload: QueueItem["payload"]
): Promise<void> {
  const db = await getDB()
  await db.add("offlineQueue", {
    type,
    payload,
    createdAt: Date.now(),
    retries: 0,
  })
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  return db.count("offlineQueue")
}

export async function flushOfflineQueue(
  handlers: Partial<Record<QueueItem["type"], (payload: Record<string, unknown>) => Promise<void>>>
): Promise<{ flushed: number; failed: number }> {
  const db = await getDB()
  const all = await db.getAll("offlineQueue")
  let flushed = 0
  let failed = 0

  for (const item of all) {
    const handler = handlers[item.type as keyof typeof handlers]
    if (!handler) continue
    try {
      await handler(item.payload)
      await db.delete("offlineQueue", item.id!)
      flushed++
    } catch {
      if (item.retries >= 3) {
        await db.delete("offlineQueue", item.id!)
        failed++
      } else {
        await db.put("offlineQueue", { ...item, retries: item.retries + 1 })
      }
    }
  }

  return { flushed, failed }
}

export async function clearOfflineQueue(): Promise<void> {
  const db = await getDB()
  await db.clear("offlineQueue")
}
