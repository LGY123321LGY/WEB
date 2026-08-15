const ZOTERO_API_BASE = '/zotero-api/api/users/0'
const ZOTERO_LIBRARY_URI = 'zotero://select/library'
const DEFAULT_REQUEST_TIMEOUT = 1200

function normalizeTitle(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleTokens(value) {
  const normalized = normalizeTitle(value)
  const words = normalized.match(/[\p{L}\p{N}]+/gu) || []
  if (words.length > 1) return new Set(words)
  const compact = normalized.replace(/\s/g, '')
  if (compact.length < 2) return new Set(compact ? [compact] : [])
  return new Set(Array.from({ length: compact.length - 1 }, (_, index) => compact.slice(index, index + 2)))
}

function tokenSimilarity(left, right) {
  const leftTokens = titleTokens(left)
  const rightTokens = titleTokens(right)
  if (!leftTokens.size || !rightTokens.size) return 0
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size
  return union ? intersection / union : 0
}

function scoreTitle(query, candidate) {
  const normalizedQuery = normalizeTitle(query)
  const normalizedCandidate = normalizeTitle(candidate)
  const compactQuery = normalizedQuery.replace(/\s/g, '')
  const compactCandidate = normalizedCandidate.replace(/\s/g, '')
  if (!compactQuery || !compactCandidate) return 0
  if (compactQuery === compactCandidate) return 1

  if (compactQuery.includes(compactCandidate) || compactCandidate.includes(compactQuery)) {
    const containmentRatio = Math.min(compactQuery.length, compactCandidate.length) / Math.max(compactQuery.length, compactCandidate.length)
    if (containmentRatio >= 0.75) return 0.9 + (containmentRatio * 0.09)
  }

  const similarity = tokenSimilarity(normalizedQuery, normalizedCandidate)
  return similarity >= 0.8 ? 0.8 + (similarity * 0.1) : 0
}

function selectUnambiguousItem(title, items) {
  const ranked = items
    .map((item) => ({ item, score: scoreTitle(title, item?.data?.title) }))
    .filter((candidate) => candidate.score >= 0.8)
    .sort((left, right) => right.score - left.score)
  if (!ranked.length) return null
  if (ranked.length > 1 && ranked[0].score - ranked[1].score < 0.08) return null
  return ranked[0].item
}

function createAbortError() {
  return new DOMException('Zotero request cancelled', 'AbortError')
}

async function fetchWithTimeout(url, { signal, timeoutMs = DEFAULT_REQUEST_TIMEOUT } = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(new DOMException('Zotero request timed out', 'TimeoutError')), timeoutMs)
  const abortRequest = () => controller.abort(signal?.reason || createAbortError())
  signal?.addEventListener('abort', abortRequest, { once: true })
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Zotero-API-Version': '3',
        'Zotero-Allowed-Request': 'true',
      },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Zotero API returned ${response.status}`)
    return response.json()
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortRequest)
  }
}

function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason || createAbortError())
      return
    }
    const onAbort = () => {
      window.clearTimeout(timeoutId)
      reject(signal.reason || createAbortError())
    }
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function resolveZoteroTarget(title, options = {}) {
  const params = new URLSearchParams({
    q: title,
    qmode: 'titleCreatorYear',
    itemType: '-attachment',
    format: 'json',
    limit: '15',
  })
  const items = await fetchWithTimeout(`${ZOTERO_API_BASE}/items/top?${params}`, options)
  const matchedItem = selectUnambiguousItem(title, Array.isArray(items) ? items : [])
  if (!matchedItem?.key) return null

  const children = await fetchWithTimeout(
    `${ZOTERO_API_BASE}/items/${encodeURIComponent(matchedItem.key)}/children?format=json&limit=100`,
    options,
  )
  const pdfAttachment = (Array.isArray(children) ? children : []).find((child) => (
    child?.data?.itemType === 'attachment'
    && (child.data.contentType === 'application/pdf' || child.data.filename?.toLocaleLowerCase().endsWith('.pdf'))
  ))

  if (pdfAttachment?.key) {
    return {
      kind: 'pdf',
      uri: `zotero://open-pdf/library/items/${pdfAttachment.key}`,
      itemKey: matchedItem.key,
      attachmentKey: pdfAttachment.key,
    }
  }

  return {
    kind: 'item',
    uri: `zotero://select/library/items/${matchedItem.key}`,
    itemKey: matchedItem.key,
    attachmentKey: null,
  }
}

export function launchZotero(uri = ZOTERO_LIBRARY_URI) {
  window.location.assign(uri)
}

export async function waitForZoteroTarget(title, { signal, timeoutMs = 8000 } = {}) {
  try {
    return await resolveZoteroTarget(title, { signal })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
  }

  launchZotero()
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await delay(500, signal)
    try {
      return await resolveZoteroTarget(title, {
        signal,
        timeoutMs: Math.min(DEFAULT_REQUEST_TIMEOUT, Math.max(250, deadline - Date.now())),
      })
    } catch (error) {
      if (error?.name === 'AbortError') throw error
    }
  }
  return null
}
