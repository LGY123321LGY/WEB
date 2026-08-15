import { Upload } from 'tus-js-client'
import { supabase, supabasePublishableKey, supabaseUrl } from './supabase'

export const PAPER_BUCKET = 'papers'
export const MAX_PDF_BYTES = 50 * 1024 * 1024
export const SIGNED_URL_SECONDS = 60 * 60
const TUS_CHUNK_BYTES = 6 * 1024 * 1024

export function validatePaperPdf(file) {
  if (!file) return '未选择文件'
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf')
  if (!hasPdfExtension || (file.type && file.type !== 'application/pdf')) return '仅支持 PDF 文件'
  if (file.size > MAX_PDF_BYTES) return '文件不能超过 50 MB'
  if (file.size === 0) return '文件内容为空'
  return null
}

export function sanitizePdfFileName(fileName) {
  const rawName = String(fileName || 'paper.pdf').trim()
  const stem = rawName.replace(/\.pdf$/i, '')
  const safeStem = stem
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|#%{}[\]]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120) || 'paper'
  return `${safeStem}.pdf`
}

export function buildPaperObjectPath(userId, fileName) {
  const nonce = globalThis.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10)
  return `${userId}/${Date.now()}-${nonce}-${sanitizePdfFileName(fileName)}`
}

export async function uploadPaperPdf({ file, userId, onProgress }) {
  const validationError = validatePaperPdf(file)
  if (validationError) throw new Error(validationError)
  if (!supabase || !supabaseUrl || !supabasePublishableKey) throw new Error('Supabase 尚未配置')

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('登录状态已失效，请重新登录')

  const objectPath = buildPaperObjectPath(userId, file.name)
  let uploader
  let rejectUpload
  const promise = new Promise((resolve, reject) => {
    rejectUpload = reject
    uploader = new Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: supabasePublishableKey,
      },
      chunkSize: TUS_CHUNK_BYTES,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: PAPER_BUCKET,
        objectName: objectPath,
        contentType: 'application/pdf',
        cacheControl: '3600',
      },
      onError: (error) => reject(error),
      onProgress: (uploadedBytes, totalBytes) => onProgress?.(uploadedBytes, totalBytes),
      onSuccess: () => resolve({
        path: objectPath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: 'application/pdf',
      }),
    })
    uploader.start()
  })

  return {
    promise,
    abort: async () => {
      try {
        await uploader?.abort(true)
      } finally {
        rejectUpload?.(new DOMException('上传已取消', 'AbortError'))
      }
    },
  }
}

export async function createPaperSignedUrl(path) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { data, error } = await supabase.storage.from(PAPER_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

export async function deletePaperPdf(path) {
  if (!path) return
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { error } = await supabase.storage.from(PAPER_BUCKET).remove([path])
  if (error) throw error
}
