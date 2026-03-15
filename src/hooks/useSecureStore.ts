import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store'
import { useCallback, useEffect, useState } from 'react'
import { useLocalStore } from './useLocalStore'

const CHUNK_SIZE = 1800
const CHUNK_PREFIX = '__chunked__:'
const INSTALL_ID_KEY = '__secure_store_install_id__'
const SECURE_KEYS_REGISTRY = '__secure_store_keys__'

type SetValue<T> = (value?: T | null) => Promise<void>
let ensureInstallPromise: Promise<void> | null = null

const createInstallId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`
const getChunkKey = (key: string, i: number) => `${key}.__chunk__.${i}`
const getChunkHeader = (count: number) => `${CHUNK_PREFIX}${count}`
const parseChunkHeader = (v: string): number | null => {
  if (!v.startsWith(CHUNK_PREFIX)) return null
  const n = Number(v.slice(CHUNK_PREFIX.length))
  return Number.isInteger(n) && n > 0 ? n : null
}
const splitChunks = (v: string, size: number) => {
  const chunks: string[] = []
  for (let i = 0; i < v.length; i += size) chunks.push(v.slice(i, i + size))
  return chunks
}

async function removeRaw(key: string) {
  const cur = await getItemAsync(key)
  const count = cur ? parseChunkHeader(cur) : null
  await deleteItemAsync(key)
  if (count) await Promise.all(Array.from({ length: count }, (_, i) => deleteItemAsync(getChunkKey(key, i))))
}

async function readRaw(key: string): Promise<string | null> {
  const raw = await getItemAsync(key)
  if (raw == null) return null
  const count = parseChunkHeader(raw)
  if (!count) return raw
  const parts = await Promise.all(Array.from({ length: count }, (_, i) => getItemAsync(getChunkKey(key, i))))
  return parts.some((p) => p == null) ? null : parts.join('')
}

async function writeRaw(key: string, raw: string) {
  await removeRaw(key)
  if (raw.length <= CHUNK_SIZE) { await setItemAsync(key, raw); return }
  const chunks = splitChunks(raw, CHUNK_SIZE)
  await Promise.all(chunks.map((c, i) => setItemAsync(getChunkKey(key, i), c)))
  await setItemAsync(key, getChunkHeader(chunks.length))
}

async function getKeys(): Promise<string[]> {
  try {
    const raw = await readRaw(SECURE_KEYS_REGISTRY)
    if (!raw) return []
    const keys = JSON.parse(raw) as string[]
    return Array.isArray(keys) ? keys.filter(Boolean) : []
  } catch { return [] }
}

async function setKeys(keys: string[]) {
  const u = [...new Set(keys)].filter((k) => k && k !== SECURE_KEYS_REGISTRY)
  if (!u.length) { await removeRaw(SECURE_KEYS_REGISTRY); return }
  await writeRaw(SECURE_KEYS_REGISTRY, JSON.stringify(u))
}

async function registerKey(key: string) {
  if (key === SECURE_KEYS_REGISTRY) return
  const keys = await getKeys()
  if (!keys.includes(key)) await setKeys([...keys, key])
}

async function unregisterKey(key: string) {
  if (key === SECURE_KEYS_REGISTRY) return
  await setKeys((await getKeys()).filter((k) => k !== key))
}

async function cleanupAll() {
  const keys = await getKeys()
  await Promise.all(keys.map(removeRaw))
  await removeRaw(SECURE_KEYS_REGISTRY)
}

async function writeValue(key: string, raw: string) {
  await writeRaw(key, raw)
  await registerKey(key)
}

async function removeValue(key: string) {
  await removeRaw(key)
  await unregisterKey(key)
}

export function useSecureStore(key: string): [string | null | undefined, SetValue<string>]
export function useSecureStore<T>(key: string): [T | null | undefined, SetValue<T>]
export function useSecureStore<T>(key: string) {
  const [installId, setInstallId] = useLocalStore<string>(INSTALL_ID_KEY)
  const [value, setValue] = useState<T | string | null>()

  useEffect(() => {
    if (installId === undefined) return
    let mounted = true
    const run = async () => {
      try {
        if (installId == null) {
          if (!ensureInstallPromise) {
            ensureInstallPromise = cleanupAll()
              .then(() => setInstallId(createInstallId()))
              .finally(() => { ensureInstallPromise = null })
          }
          await ensureInstallPromise
          if (mounted) setValue(null)
          return
        }
        const raw = await readRaw(key)
        if (!mounted) return
        if (raw == null) { setValue(null); return }
        try { setValue(JSON.parse(raw)) } catch { setValue(raw) }
      } catch { if (mounted) setValue(null) }
    }
    void run()
    return () => { mounted = false }
  }, [installId, key, setInstallId])

  const set = useCallback(
    async (next?: T | string | null) => {
      if (installId == null) {
        if (!ensureInstallPromise) {
          ensureInstallPromise = cleanupAll()
            .then(() => setInstallId(createInstallId()))
            .finally(() => { ensureInstallPromise = null })
        }
        await ensureInstallPromise
      }
      if (next == null) { await removeValue(key); setValue(null); return }
      const raw = typeof next === 'string' ? next : JSON.stringify(next)
      await writeValue(key, raw)
      setValue(next)
    },
    [installId, key, setInstallId]
  )

  return [value, set]
}
